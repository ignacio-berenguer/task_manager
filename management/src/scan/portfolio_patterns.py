"""Portfolio ID pattern matching for document scanning."""
import re

# Portfolio ID patterns:
# SPA_NN_N..NNNN (e.g. SPA_25_1, SPA_25_100)
# SPA_XX-XXX_N..NNNN (e.g. SPA_AM-OTH_1, SPA_AM-OTH_1092)
PORTFOLIO_ID_PATTERN = re.compile(
    r'(SPA_\d{2}_\d{1,4}|SPA_[A-Z]{2}-[A-Z]{3}_\d{1,4})'
)


def extract_portfolio_id(name: str) -> str | None:
    """
    Extract portfolio_id from a folder name or filename.

    Returns the first match found, or None if no pattern matches.
    """
    match = PORTFOLIO_ID_PATTERN.search(name)
    return match.group(1) if match else None
