# Contributing to ERGIO Engines

Thank you for your interest in contributing to ERGIO — the AI Business Operating System by MUTYINT.

## Getting Started

1. Fork the repository
2. Clone your fork: git clone https://github.com/YOUR_USERNAME/ergio-engines.git
3. Create a branch: git checkout -b feature/your-feature-name
4. Install dependencies: pip install -r requirements.txt
5. Run the server: python main.py

## Architecture Overview

ERGIO uses a Conductor-Worker model:
- Conductor (conductor.py): AI brain that understands, decomposes, and routes requests
- Engines: 10 specialized workers (website, lead, booking, invoice, payment, content, voice, analytics, reputation, workflow)
- MCPs: 25 external tool integrations (Stripe, Groq, Higgsfield, Clay, etc.)
- Plugins: 30 business integrations (WhatsApp, Shopify, Discord, Pinterest, etc.)
- Approval Gateway: Human-in-the-loop for external actions
- Circuit Breaker: Fault tolerance with retry and backoff
- Ping Engine: Keeps Render free tier awake

## Adding a New MCP

1. Add the MCP to the MCP_REGISTRY in engine_system/mcp_client.py:
```python
"new_mcp": {
    "url": "https://api.example.com/v1",
    "auth_type": "bearer",  # or "header", "basic", "query_param", "sdk"
    "key_env": "NEW_MCP_API_KEY",
    "capabilities": ["do_thing", "get_thing"],
}
```

2. Add endpoint mapping in the _build_endpoint method
3. Add the env var to config.py and render.yaml
4. Add a fallback if applicable in _get_fallback
5. Test: curl -X POST localhost:8000/mcp/new_mcp/do_thing -d '{"param": "value"}'

## Adding a New Plugin

1. Add the plugin to the PLUGIN_REGISTRY in engine_system/plugin_sandbox.py:
```python
"new_plugin": {
    "type": "external",  # or "internal"
    "requires_approval": True,  # True for external actions
    "mcp": None,  # or delegate to an MCP like "twilio"
    "capabilities": ["send_thing", "get_thing"],
}
```

2. Add API config in _call_direct_api if it uses direct HTTP calls
3. Add endpoint mapping in _build_plugin_endpoint
4. If requires_approval is True, the action will queue in the approval gateway
5. Add the env var to config.py and render.yaml

## Adding a New Engine

1. Create engines/engine_XX_name.py with an async run function
2. Add the engine to the Conductor in engine_system/conductor.py:
```python
self.engines["new_engine"] = self._engine_new

async def _engine_new(self, action, params, business_id):
    if action == "do_thing":
        # implementation
        return {"status": "completed", "result": ...}
```

## Code Style

- Python 3.11+
- Async/await for all I/O operations
- Type hints encouraged
- Log all important actions using utils.logger
- All external API calls go through the circuit breaker (with_retry)
- External actions require human approval (approval gateway)

## Testing

Before submitting a PR:
1. Run syntax check: python -c "import py_compile; py_compile.compile('your_file.py', doraise=True)"
2. Start the server: python main.py
3. Test your endpoint: curl localhost:8000/your-endpoint
4. Check the /status endpoint to verify your MCP/plugin is registered

## Pull Request Process

1. Update the README.md if you added new endpoints, MCPs, or plugins
2. Update the version number in main.py if significant changes
3. Ensure all tests pass and the server starts without errors
4. Your PR will be reviewed by the MUTYINT team

## Code of Conduct

- Be respectful and constructive
- Focus on what is best for the community
- Show empathy towards other community members

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Built by MUTYINT. Powered by Groq. Deployed on Render.
