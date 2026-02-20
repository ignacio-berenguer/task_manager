"""Abstract LLM interface with Claude implementation."""

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass

logger = logging.getLogger('portfolio_summarize')


@dataclass
class SummarizeResult:
    """Result from an LLM summarization call."""
    text: str
    input_tokens: int
    output_tokens: int


class LLMClient(ABC):
    """Abstract base class for LLM providers."""

    @abstractmethod
    def summarize(self, content: str, system_prompt: str) -> SummarizeResult:
        """
        Send document content with a system prompt and return the LLM response.

        Each call must be a fresh request with no conversation history.

        Args:
            content: The document text to summarize
            system_prompt: The system-level instructions for summarization

        Returns:
            SummarizeResult with response text and token usage
        """
        pass


class ClaudeClient(LLMClient):
    """Anthropic Claude implementation using the anthropic SDK."""

    def __init__(self, api_key: str, model: str, max_tokens: int, temperature: float):
        from anthropic import Anthropic

        self._client = Anthropic(api_key=api_key)
        self._model = model
        self._max_tokens = max_tokens
        self._temperature = temperature
        logger.info(f"Claude client initialized (model={model}, max_tokens={max_tokens})")

    def summarize(self, content: str, system_prompt: str) -> SummarizeResult:
        """Each call creates a fresh messages request (no context contamination)."""
        logger.debug(f"Sending to Claude: content={len(content)} chars, model={self._model}")

        response = self._client.messages.create(
            model=self._model,
            max_tokens=self._max_tokens,
            temperature=self._temperature,
            system=system_prompt,
            messages=[
                {"role": "user", "content": content}
            ],
        )

        result = response.content[0].text
        input_tokens = response.usage.input_tokens
        output_tokens = response.usage.output_tokens
        logger.debug(f"Claude response: {len(result)} chars, stop_reason={response.stop_reason}, "
                      f"tokens_in={input_tokens}, tokens_out={output_tokens}")
        return SummarizeResult(text=result, input_tokens=input_tokens, output_tokens=output_tokens)


def create_llm_client(provider: str, **kwargs) -> LLMClient:
    """
    Factory function to create an LLM client.

    Args:
        provider: Provider name ('claude'). Future: 'openai', 'gemini'
        **kwargs: Provider-specific configuration (api_key, model, max_tokens, temperature)

    Returns:
        An LLMClient instance
    """
    providers = {
        'claude': ClaudeClient,
    }

    client_class = providers.get(provider)
    if not client_class:
        raise ValueError(
            f"Unknown LLM provider: '{provider}'. Available: {list(providers.keys())}"
        )

    return client_class(**kwargs)
