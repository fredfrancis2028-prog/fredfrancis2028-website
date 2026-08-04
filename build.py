#!/usr/bin/env python3
"""
Fred Francis 2028 Website — Static Site Build Script

Assembles pages from layouts, partials, and components.
Zero external dependencies — Python 3.6+ standard library only.

Usage:
    python3 build.py          # Build all pages to dist/
    python3 build.py --diff   # Build and diff against current root-level files
"""

import json
import os
import re
import shutil
import sys
import glob

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src")
DIST = os.path.join(ROOT, "dist")
PAGES = os.path.join(SRC, "pages")
LAYOUTS = os.path.join(SRC, "layouts")
PARTIALS = os.path.join(SRC, "partials")
COMPONENTS = os.path.join(SRC, "components")
SRC_ASSETS = os.path.join(SRC, "assets")
DIST_ASSETS = os.path.join(DIST, "assets")
CONFIG_FILE = os.path.join(ROOT, "build-config.json")

# ---------------------------------------------------------------------------
# Front matter parser (simple YAML-like, no external dependency)
# ---------------------------------------------------------------------------
def parse_front_matter(text):
    """Parse ---delimited front matter. Returns (vars_dict, content_string)."""
    if not text.startswith("---"):
        return {}, text
    end = text.index("---", 3)
    fm_block = text[3:end].strip()
    content = text[end + 3:].lstrip("\n")
    variables = {}
    current_key = None
    current_list = None
    current_dict_key = None

    for line in fm_block.split("\n"):
        stripped = line.strip()
        if not stripped:
            continue

        # Top-level key: value
        top_match = re.match(r'^([a-z_]+)\s*:\s*(.*)', line)
        if top_match and not line.startswith("  "):
            current_key = top_match.group(1)
            value = top_match.group(2).strip()
            if value:
                variables[current_key] = value
            else:
                variables[current_key] = []
            current_list = None
            current_dict_key = None
            continue

        # List item at first indent level: "  - something"
        list_match = re.match(r'^  - (.+)', line)
        if list_match and current_key is not None:
            item_text = list_match.group(1).strip()
            # Check if it's a "key:" dict-style list item
            dict_match = re.match(r'^([a-z_-]+)\s*:\s*(.*)', item_text)
            if dict_match:
                current_dict_key = dict_match.group(1)
                dict_val = dict_match.group(2).strip()
                if dict_val:
                    # Simple list item like "- name: Home"
                    if not isinstance(variables[current_key], list):
                        variables[current_key] = []
                    variables[current_key].append({current_dict_key: dict_val})
                else:
                    # Dict-style component entry: "- comment-form:"
                    if not isinstance(variables[current_key], list):
                        variables[current_key] = []
                    variables[current_key].append({current_dict_key: {}})
            else:
                if not isinstance(variables[current_key], list):
                    variables[current_key] = []
                variables[current_key].append(item_text)
            continue

        # Sub-key at second indent: "      page_slug: veterans"
        sub_match = re.match(r'^      ([a-z_]+)\s*:\s*(.*)', line)
        if sub_match and current_dict_key is not None and current_key is not None:
            sub_key = sub_match.group(1)
            sub_val = sub_match.group(2).strip()
            lst = variables[current_key]
            if isinstance(lst, list) and lst:
                last = lst[-1]
                if isinstance(last, dict) and current_dict_key in last:
                    target = last[current_dict_key]
                    if isinstance(target, dict):
                        target[sub_key] = sub_val
            continue

        # Breadcrumb-style sub-keys at 4-space indent
        sub_match2 = re.match(r'^    ([a-z_]+)\s*:\s*(.*)', line)
        if sub_match2 and current_key is not None:
            sub_key = sub_match2.group(1)
            sub_val = sub_match2.group(2).strip()
            lst = variables[current_key]
            if isinstance(lst, list) and lst:
                last = lst[-1]
                if isinstance(last, dict):
                    last[sub_key] = sub_val
            continue

    return variables, content


# ---------------------------------------------------------------------------
# File I/O helpers
# ---------------------------------------------------------------------------
def read_file(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


# ---------------------------------------------------------------------------
# Template resolution
# ---------------------------------------------------------------------------
def load_partial(name):
    """Load a partial file from src/partials/."""
    path = os.path.join(PARTIALS, "template-" + name + ".html")
    if not os.path.exists(path):
        print(f"  WARNING: partial '{name}' not found at {path}")
        return ""
    return read_file(path).rstrip('\n')


def load_layout(name):
    """Load a layout file from src/layouts/."""
    path = os.path.join(LAYOUTS, "template-" + name + ".html")
    if not os.path.exists(path):
        print(f"  ERROR: layout '{name}' not found at {path}")
        sys.exit(1)
    return read_file(path)


def load_component(name):
    """Load a component HTML file from src/components/<name>/."""
    path = os.path.join(COMPONENTS, name, "template-" + name + ".html")
    if not os.path.exists(path):
        print(f"  WARNING: component '{name}' not found at {path}")
        return ""
    return read_file(path)


def resolve_extends(layout_text):
    """If layout starts with {{extends:name}}, load parent and return both."""
    match = re.match(r'\{\{extends:(\w+)\}\}', layout_text.strip())
    if not match:
        return layout_text, None
    parent_name = match.group(1)
    child_text = layout_text.strip()[match.end():].strip()
    parent_text = load_layout(parent_name)
    return parent_text, child_text


def extract_defines(text):
    """Extract all {{define:name}}...{{enddefine}} blocks from text."""
    defines = {}
    pattern = re.compile(
        r'\{\{define:(\w+)\}\}(.*?)\{\{enddefine\}\}',
        re.DOTALL
    )
    for match in pattern.finditer(text):
        content = match.group(2)
        # Strip leading/trailing newlines but preserve internal indentation
        content = content.lstrip('\n').rstrip()
        defines[match.group(1)] = content
    remaining = pattern.sub("", text)
    # Only strip if defines were actually found (to avoid disturbing content indentation)
    if defines:
        remaining = remaining.strip('\n')
    return defines, remaining


def fill_slots(template, defines):
    """Replace {{slot:name}} markers with corresponding define content.
    If a slot resolves to empty, consume the line it was on to avoid blank lines."""
    # Replace slots that would resolve to empty — consume the whole line
    def empty_replacer(match):
        slot_name = match.group(1)
        content = defines.get(slot_name, "")
        if not content.strip():
            return ""  # Consume the \n...slot...\n into nothing
        return match.group(0)  # Leave it for the next pass

    template = re.sub(r'\n\{\{slot:(\w+)\}\}(?=\n)', empty_replacer, template)

    # Now replace remaining (non-empty) slots normally
    def replacer(match):
        slot_name = match.group(1)
        return defines.get(slot_name, "")
    return re.sub(r'\{\{slot:(\w+)\}\}', replacer, template)


def resolve_partials(text):
    """Resolve all {{partial:name}} and {{partial:name param="val"}} tags."""
    max_depth = 5  # Prevent infinite recursion
    for _ in range(max_depth):
        # With parameters
        param_pattern = re.compile(
            r'\{\{partial:([a-z_-]+)\s+([^}]+)\}\}'
        )
        # Without parameters
        simple_pattern = re.compile(
            r'\{\{partial:([a-z_-]+)\}\}'
        )

        if not param_pattern.search(text) and not simple_pattern.search(text):
            break

        def replace_param(match):
            name = match.group(1)
            params_str = match.group(2)
            content = load_partial(name)
            # Parse params like: active="/issues/veterans.html"
            for pm in re.finditer(r'(\w+)="([^"]*)"', params_str):
                content = content.replace("{{" + pm.group(1) + "}}", pm.group(2))
            return content

        text = param_pattern.sub(replace_param, text)
        text = simple_pattern.sub(lambda m: load_partial(m.group(1)), text)

    return text


def resolve_components(text, page_vars):
    """Resolve all {{component:name}} tags using parameters from front matter."""
    comp_list = page_vars.get("components", [])
    # Build a lookup: component_name -> {param: value}
    comp_params = {}
    if isinstance(comp_list, list):
        for entry in comp_list:
            if isinstance(entry, dict):
                for comp_name, params in entry.items():
                    if isinstance(params, dict):
                        comp_params[comp_name] = params
                    else:
                        comp_params[comp_name] = {}

    def replacer(match):
        name = match.group(1)
        content = load_component(name)
        params = comp_params.get(name, {})
        for key, val in params.items():
            content = content.replace("{{" + key + "}}", str(val))
        return content

    return re.sub(r'\{\{component:([a-z_-]+)\}\}', replacer, text)


def resolve_variables(text, variables):
    """Replace all {{variable_name}} placeholders with values."""
    def replacer(match):
        var_name = match.group(1)
        val = variables.get(var_name, "")
        if isinstance(val, str):
            return val
        return ""
    return re.sub(r'\{\{(\w+)\}\}', replacer, text)


def set_nav_active(html, nav_active):
    """Mark the active nav link by adding 'active' class."""
    if not nav_active:
        return html
    # Replace the exact href match: class="nav-item" -> class="nav-item active"
    target = f'href="{nav_active}" class="nav-item"'
    replacement = f'href="{nav_active}" class="nav-item active"'
    return html.replace(target, replacement)


def expand_nav_section(html, nav_expand):
    """Expand a nav tree section (domestic, foreign, governance).

    The nav partial stores all sections collapsed. This function expands
    the section matching nav_expand by:
    - Changing ▶ to ▼ on the toggle button
    - Removing 'tree-collapsed' from the child <ul>
    """
    if not nav_expand:
        return html

    # Map nav_expand values to the aria-label text used in the toggle buttons
    section_labels = {
        "domestic": "Expand Domestic Policy",
        "foreign": "Expand Foreign Policy",
        "governance": "Expand Governance",
    }

    label = section_labels.get(nav_expand)
    if not label:
        return html

    # Replace ▶ with ▼ for the matching section
    html = html.replace(
        f'aria-label="{label}">▶</button>',
        f'aria-label="{label}">▼</button>'
    )
    # Remove tree-collapsed from the <ul> that follows the matching toggle
    # The pattern is: ...label">▼</button>\n    <ul class="sitemap-list indent-2 tree-collapsed">
    # We need to remove only the FIRST tree-collapsed after the expanded toggle
    parts = html.split(f'aria-label="{label}">▼</button>')
    if len(parts) == 2:
        # Fix the first occurrence of tree-collapsed in the second part
        parts[1] = parts[1].replace(
            ' tree-collapsed">', '">', 1
        )
        html = f'aria-label="{label}">▼</button>'.join(parts)

    return html


# ---------------------------------------------------------------------------
# Page builder
# ---------------------------------------------------------------------------
def build_page(page_path, config):
    """Build a single page from its source file."""
    rel_path = os.path.relpath(page_path, PAGES)
    print(f"  Building: {rel_path}")

    raw = read_file(page_path)
    page_vars, content = parse_front_matter(raw)
    content = content.rstrip()

    # Merge config globals (page values take precedence)
    variables = dict(config)
    variables.update(page_vars)

    # Auto-generate schema_title if not explicitly set
    # (strips &nbsp; from title for use in JSON-LD where entities aren't appropriate)
    if "schema_title" not in variables and "title" in variables:
        st = variables["title"].replace("&nbsp;", " ")
        # Collapse any double spaces (from &nbsp; + adjacent space)
        while "  " in st:
            st = st.replace("  ", " ")
        variables["schema_title"] = st

    # Auto-generate title_tag for <title> element
    if "title_tag" not in variables:
        if "full_title" in variables:
            variables["title_tag"] = variables["full_title"]
        elif "title" in variables:
            variables["title_tag"] = variables["title"] + " | " + variables.get("site_name", "")
        else:
            variables["title_tag"] = variables.get("site_name", "")

    # Determine layout
    layout_name = variables.get("layout", "base")
    layout_text = load_layout(layout_name)

    # Resolve extends chain
    parent_text, child_text = resolve_extends(layout_text)

    if child_text is not None:
        # Child layout defines slots for parent
        child_defines, _ = extract_defines(child_text)

        # Extract any defines from the page content itself
        # (e.g., {{define:page_schema}}...{{enddefine}} in generic pages)
        page_defines, remaining_content = extract_defines(content)

        # Page content (minus defines) fills the 'body' slot in the child layout
        # Also fill any page-level defines into the child's slots
        fill_map = dict(page_defines)
        fill_map["body"] = remaining_content

        # Resolve slots within each child define
        for key in child_defines:
            child_defines[key] = fill_slots(child_defines[key], fill_map)
        # Fill child's defines into parent's slots
        assembled = fill_slots(parent_text, child_defines)
    else:
        # No extends — page content fills the 'content' slot directly
        assembled = fill_slots(parent_text, {"content": content})

    # Resolve partials (recursive)
    assembled = resolve_partials(assembled)

    # Resolve components
    assembled = resolve_components(assembled, variables)

    # Resolve variables
    assembled = resolve_variables(assembled, variables)

    # Set nav active link
    assembled = set_nav_active(assembled, variables.get("nav_active", ""))

    # Expand the relevant nav tree section
    assembled = expand_nav_section(assembled, variables.get("nav_expand", ""))

    # Clean up: remove empty description meta tag (e.g., 404 page has no description)
    assembled = assembled.replace('<meta name="description" content="">\n', '')

    # Write output
    out_path = os.path.join(DIST, rel_path)
    write_file(out_path, assembled)
    return rel_path


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    diff_mode = "--diff" in sys.argv

    print("Fred Francis 2028 — Building site...")
    print(f"  Source: {SRC}")
    print(f"  Output: {DIST}")

    # Load config
    if os.path.exists(CONFIG_FILE):
        config = json.loads(read_file(CONFIG_FILE))
    else:
        config = {}
        print("  WARNING: build-config.json not found, using empty config")

    # Clean dist/
    if os.path.exists(DIST):
        shutil.rmtree(DIST)
    os.makedirs(DIST)

    # Copy assets
    if os.path.exists(SRC_ASSETS):
        shutil.copytree(SRC_ASSETS, DIST_ASSETS)
        print(f"  Copied assets to {DIST_ASSETS}")

    # Copy root-level static files (sitemap, rss, robots, etc.)
    STATIC_DIR = os.path.join(SRC, "static")
    if os.path.exists(STATIC_DIR):
        for fname in os.listdir(STATIC_DIR):
            src_file = os.path.join(STATIC_DIR, fname)
            if os.path.isfile(src_file):
                shutil.copy2(src_file, os.path.join(DIST, fname))
        print(f"  Copied static files to {DIST}")

    # Build pages
    pages_built = []
    for dirpath, dirnames, filenames in os.walk(PAGES):
        for filename in sorted(filenames):
            if filename.endswith(".html"):
                page_path = os.path.join(dirpath, filename)
                rel = build_page(page_path, config)
                pages_built.append(rel)

    print(f"\nDone. {len(pages_built)} pages built.")
    for p in pages_built:
        print(f"  ✓ {p}")

    # Diff mode: compare dist/ output against root-level originals
    if diff_mode:
        print("\n--- DIFF MODE ---")
        import subprocess
        any_diff = False
        for rel in pages_built:
            original = os.path.join(ROOT, rel)
            built = os.path.join(DIST, rel)
            if os.path.exists(original):
                result = subprocess.run(
                    ["diff", "-u", original, built],
                    capture_output=True, text=True
                )
                if result.stdout:
                    print(f"\nDIFF in {rel}:")
                    print(result.stdout[:2000])
                    if len(result.stdout) > 2000:
                        print(f"  ... ({len(result.stdout)} chars total)")
                    any_diff = True
            else:
                print(f"  No original found for {rel} (new page?)")
        if not any_diff:
            print("  No differences found — output matches originals exactly.")


if __name__ == "__main__":
    main()
