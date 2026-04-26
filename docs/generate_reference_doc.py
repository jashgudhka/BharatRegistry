from docx import Document
from docx.shared import Pt
from docx.enum.text import WD_LINE_SPACING


def configure_style(style, font_name, font_size, bold=False):
    style.font.name = font_name
    style.font.size = Pt(font_size)
    style.font.bold = bold
    paragraph_format = style.paragraph_format
    paragraph_format.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
    paragraph_format.space_after = Pt(8)


def main():
    doc = Document()

    # Base paragraph style
    configure_style(doc.styles["Normal"], "Times New Roman", 12, bold=False)

    # Title and subtitle styles used by pandoc metadata
    configure_style(doc.styles["Title"], "Times New Roman", 20, bold=True)
    configure_style(doc.styles["Subtitle"], "Times New Roman", 14, bold=False)

    # Heading hierarchy
    configure_style(doc.styles["Heading 1"], "Times New Roman", 16, bold=True)
    configure_style(doc.styles["Heading 2"], "Times New Roman", 14, bold=True)
    configure_style(doc.styles["Heading 3"], "Times New Roman", 12, bold=True)

    # Caption styling
    if "Caption" in doc.styles:
        configure_style(doc.styles["Caption"], "Times New Roman", 11, bold=False)

    output_path = "docs/report-reference.docx"
    doc.save(output_path)
    print(f"Created {output_path}")


if __name__ == "__main__":
    main()
