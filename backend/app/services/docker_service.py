"""Docker container status service via Unix socket API with caching."""
import asyncio
import json
import time
from dataclasses import dataclass

DOCKER_SOCKET = "/var/run/docker.sock"


@dataclass
class ContainerInfo:
    name: str
    status: str
    state: str  # running, exited, etc.


class DockerService:
    """Queries Docker Engine API via Unix socket. Caches results."""

    def __init__(self, cache_ttl: int = 10):
        self._cache: list[ContainerInfo] = []
        self._cache_time: float = 0
        self._cache_ttl = cache_ttl

    async def get_containers(self) -> list[dict]:
        now = time.time()
        if now - self._cache_time < self._cache_ttl and self._cache:
            return [{"name": c.name, "status": c.status, "state": c.state} for c in self._cache]

        try:
            reader, writer = await asyncio.open_unix_connection(DOCKER_SOCKET)
            request = (
                "GET /containers/json?all=true HTTP/1.1\r\n"
                "Host: localhost\r\n"
                "Connection: close\r\n"
                "\r\n"
            )
            writer.write(request.encode())
            await writer.drain()

            response = await reader.read()
            writer.close()

            # Parse HTTP response — skip headers, find JSON body
            text = response.decode("utf-8", errors="replace")
            body_start = text.find("\r\n\r\n")
            if body_start == -1:
                return [{"name": c.name, "status": c.status, "state": c.state} for c in self._cache]

            body = text[body_start + 4 :]
            # Handle chunked transfer encoding
            if "Transfer-Encoding: chunked" in text[:body_start]:
                # Parse chunked body: size\r\ndata\r\n...0\r\n
                decoded = []
                while body:
                    line_end = body.find("\r\n")
                    if line_end == -1:
                        break
                    chunk_size_str = body[:line_end].strip()
                    if not chunk_size_str:
                        body = body[line_end + 2 :]
                        continue
                    chunk_size = int(chunk_size_str, 16)
                    if chunk_size == 0:
                        break
                    chunk_data = body[line_end + 2 : line_end + 2 + chunk_size]
                    decoded.append(chunk_data)
                    body = body[line_end + 2 + chunk_size + 2 :]
                body = "".join(decoded)

            data = json.loads(body)
            containers = []
            for c in data:
                names = c.get("Names", [])
                name = names[0].lstrip("/") if names else "unknown"
                containers.append(
                    ContainerInfo(
                        name=name,
                        status=c.get("Status", "unknown"),
                        state=c.get("State", "unknown"),
                    )
                )
            self._cache = containers
            self._cache_time = now
        except Exception:
            pass  # Return cached/empty on failure

        return [{"name": c.name, "status": c.status, "state": c.state} for c in self._cache]


# Singleton
docker_service = DockerService()
