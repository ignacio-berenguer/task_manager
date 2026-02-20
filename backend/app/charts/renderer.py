"""Chart rendering engine — generates PNG images from structured data."""

import logging
from io import BytesIO

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

from .themes import apply_theme, get_colors
from .utils import format_value, group_small_categories, truncate_label

logger = logging.getLogger("portfolio_agent")

# Valid chart types
VALID_CHART_TYPES = {"barra", "barra_horizontal", "tarta", "linea", "barra_apilada"}


class ChartRenderer:
    """Generates chart images from structured data."""

    def __init__(self, dpi: int = 150, default_width: int = 900,
                 default_height: int = 600, max_categories: int = 15):
        self.dpi = dpi
        self.default_width = default_width
        self.default_height = default_height
        self.max_categories = max_categories

    def render(self, chart_type: str, title: str, data: list[dict],
               options: dict | None = None) -> bytes:
        """Render a chart and return PNG bytes.

        Args:
            chart_type: One of VALID_CHART_TYPES.
            title: Chart title.
            data: List of dicts with 'etiqueta' and 'valor' (or 'valores' for stacked).
            options: Optional customization dict.

        Returns:
            PNG image as bytes.
        """
        options = options or {}
        width = options.get("ancho", self.default_width)
        height = options.get("alto", self.default_height)
        fig_w = width / self.dpi
        fig_h = height / self.dpi

        renderer_map = {
            "barra": self._render_bar,
            "barra_horizontal": self._render_horizontal_bar,
            "tarta": self._render_pie,
            "linea": self._render_line,
            "barra_apilada": self._render_stacked_bar,
        }

        render_fn = renderer_map[chart_type]

        try:
            fig = render_fn(title, data, options, fig_w, fig_h)
            buf = BytesIO()
            fig.savefig(buf, format="png", dpi=self.dpi, bbox_inches="tight",
                        facecolor="white", edgecolor="none")
            buf.seek(0)
            png_bytes = buf.getvalue()
            logger.debug("Chart rendered: type=%s, size=%d bytes", chart_type, len(png_bytes))
            return png_bytes
        finally:
            plt.close(fig)

    def _render_bar(self, title: str, data: list[dict], options: dict,
                    fig_w: float, fig_h: float):
        """Render a vertical bar chart."""
        data = self._sort_and_group(data, options)
        labels = [truncate_label(str(d.get("etiqueta", "")), 20) for d in data]
        values = [d.get("valor", 0) or 0 for d in data]
        colors = get_colors(len(data))
        fmt = options.get("formato_valor", "numero")

        fig, ax = plt.subplots(figsize=(fig_w, fig_h))
        apply_theme(fig, ax)
        bars = ax.bar(range(len(labels)), values, color=colors, width=0.7, edgecolor="white", linewidth=0.5)

        ax.set_xticks(range(len(labels)))
        ax.set_xticklabels(labels, rotation=45 if len(labels) > 6 else 0,
                           ha="right" if len(labels) > 6 else "center", fontsize=8)

        if options.get("mostrar_valores", True):
            for bar, val in zip(bars, values):
                if val != 0:
                    ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height(),
                            format_value(val, fmt), ha="center", va="bottom", fontsize=7,
                            color="#475569")

        self._apply_labels(ax, title, options)
        fig.tight_layout()
        return fig

    def _render_horizontal_bar(self, title: str, data: list[dict], options: dict,
                               fig_w: float, fig_h: float):
        """Render a horizontal bar chart. Preserves input data order (first item at top)."""
        data = self._sort_and_group(data, options)
        # Reverse so first item appears at top (matplotlib renders bottom-to-top)
        data = list(reversed(data))
        labels = [truncate_label(str(d.get("etiqueta", "")), 30) for d in data]
        values = [d.get("valor", 0) or 0 for d in data]
        colors = get_colors(len(data))
        colors = list(reversed(colors[:len(data)]))
        fmt = options.get("formato_valor", "numero")

        fig, ax = plt.subplots(figsize=(fig_w, fig_h))
        apply_theme(fig, ax)
        ax.grid(True, axis="x", linestyle="--", alpha=0.3, color="#94a3b8")
        ax.grid(False, axis="y")

        bars = ax.barh(range(len(labels)), values, color=colors, height=0.7,
                       edgecolor="white", linewidth=0.5)
        ax.set_yticks(range(len(labels)))
        ax.set_yticklabels(labels, fontsize=8)

        if options.get("mostrar_valores", True):
            for bar, val in zip(bars, values):
                if val != 0:
                    ax.text(bar.get_width(), bar.get_y() + bar.get_height() / 2,
                            f" {format_value(val, fmt)}", ha="left", va="center",
                            fontsize=7, color="#475569")

        self._apply_labels(ax, title, options, swap_axes=True)
        fig.tight_layout()
        return fig

    def _render_pie(self, title: str, data: list[dict], options: dict,
                    fig_w: float, fig_h: float):
        """Render a donut/pie chart."""
        max_cats = options.get("max_categorias", min(self.max_categories, 10))
        data = group_small_categories(data, max_cats)
        labels = [truncate_label(str(d.get("etiqueta", "")), 25) for d in data]
        values = [d.get("valor", 0) or 0 for d in data]
        colors = get_colors(len(data))
        total = sum(values) or 1

        # Explode largest slice
        explode = [0] * len(values)
        if values:
            max_idx = values.index(max(values))
            explode[max_idx] = 0.05

        fig, ax = plt.subplots(figsize=(fig_w, fig_h))
        fig.patch.set_facecolor("white")

        def autopct_func(pct):
            return f"{pct:.1f}%".replace(".", ",") if pct >= 3 else ""

        wedges, texts, autotexts = ax.pie(
            values, labels=None, autopct=autopct_func, colors=colors,
            explode=explode, startangle=90, pctdistance=0.75,
            wedgeprops={"width": 0.7, "edgecolor": "white", "linewidth": 2},
        )

        for t in autotexts:
            t.set_fontsize(8)
            t.set_color("#334155")

        # Legend
        legend_labels = [f"{lab} ({format_value(val, options.get('formato_valor', 'numero'))})"
                         for lab, val in zip(labels, values)]
        ax.legend(wedges, legend_labels, loc="center left", bbox_to_anchor=(1, 0.5),
                  fontsize=8, frameon=False)

        ax.set_title(title, fontsize=13, fontweight="bold", color="#1e293b", pad=15)
        subtitle = options.get("subtitulo")
        if subtitle:
            ax.text(0.5, 1.02, subtitle, transform=ax.transAxes, fontsize=9,
                    color="#64748b", ha="center")

        fig.tight_layout()
        return fig

    def _render_line(self, title: str, data: list[dict], options: dict,
                     fig_w: float, fig_h: float):
        """Render a line chart."""
        labels = [str(d.get("etiqueta", "")) for d in data]
        values = [d.get("valor", 0) or 0 for d in data]
        fmt = options.get("formato_valor", "numero")

        fig, ax = plt.subplots(figsize=(fig_w, fig_h))
        apply_theme(fig, ax)
        ax.grid(True, axis="x", linestyle="--", alpha=0.2, color="#94a3b8")

        color = get_colors(1)[0]
        ax.plot(range(len(labels)), values, color=color, linewidth=2.5,
                marker="o", markersize=7, markerfacecolor="white",
                markeredgecolor=color, markeredgewidth=2, zorder=5)

        # Fill under line
        ax.fill_between(range(len(labels)), values, alpha=0.1, color=color)

        ax.set_xticks(range(len(labels)))
        ax.set_xticklabels(labels, rotation=45 if len(labels) > 8 else 0,
                           ha="right" if len(labels) > 8 else "center", fontsize=8)

        if options.get("mostrar_valores", True):
            for i, val in enumerate(values):
                ax.text(i, val, f" {format_value(val, fmt)}", ha="center",
                        va="bottom", fontsize=7, color="#475569")

        self._apply_labels(ax, title, options)
        fig.tight_layout()
        return fig

    def _render_stacked_bar(self, title: str, data: list[dict], options: dict,
                            fig_w: float, fig_h: float):
        """Render a stacked bar chart (multi-series)."""
        if not data or "valores" not in data[0]:
            # Fallback: treat as regular bar if no multi-series data
            return self._render_bar(title, data, options, fig_w, fig_h)

        labels = [truncate_label(str(d.get("etiqueta", "")), 20) for d in data]
        series_keys = list(data[0]["valores"].keys())
        colors = get_colors(len(series_keys))

        fig, ax = plt.subplots(figsize=(fig_w, fig_h))
        apply_theme(fig, ax)

        bottoms = [0.0] * len(labels)
        for idx, key in enumerate(series_keys):
            values = [d.get("valores", {}).get(key, 0) or 0 for d in data]
            ax.bar(range(len(labels)), values, bottom=bottoms, color=colors[idx],
                   label=key, width=0.7, edgecolor="white", linewidth=0.5)
            bottoms = [b + v for b, v in zip(bottoms, values)]

        ax.set_xticks(range(len(labels)))
        ax.set_xticklabels(labels, rotation=45 if len(labels) > 6 else 0,
                           ha="right" if len(labels) > 6 else "center", fontsize=8)

        ax.legend(fontsize=8, frameon=False, loc="upper right")
        self._apply_labels(ax, title, options)
        fig.tight_layout()
        return fig

    def _sort_and_group(self, data: list[dict], options: dict) -> list[dict]:
        """Group small categories if needed. Preserves input data order."""
        max_cats = options.get("max_categorias", self.max_categories)
        return group_small_categories(data, max_cats)

    @staticmethod
    def _apply_labels(ax, title: str, options: dict, swap_axes: bool = False):
        """Apply title, subtitle, and axis labels."""
        ax.set_title(title, fontsize=13, fontweight="bold", color="#1e293b", pad=15)

        subtitle = options.get("subtitulo")
        if subtitle:
            ax.text(0.5, 1.02, subtitle, transform=ax.transAxes, fontsize=9,
                    color="#64748b", ha="center")

        label_x = options.get("etiqueta_x")
        label_y = options.get("etiqueta_y")
        if swap_axes:
            if label_x:
                ax.set_ylabel(label_x, fontsize=9, color="#475569")
            if label_y:
                ax.set_xlabel(label_y, fontsize=9, color="#475569")
        else:
            if label_x:
                ax.set_xlabel(label_x, fontsize=9, color="#475569")
            if label_y:
                ax.set_ylabel(label_y, fontsize=9, color="#475569")
