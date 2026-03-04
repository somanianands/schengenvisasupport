#!/usr/bin/env python3
import os
import re

def improve_table_accessibility(content):
    """Improve table accessibility using careful regex patterns"""

    # First, add scope="col" to th elements that don't already have scope
    def add_scope_to_th(match):
        th_tag = match.group(0)
        # Check if scope is already present
        if 'scope=' in th_tag:
            return th_tag
        # Add scope="col" before the closing >
        return th_tag[:-1] + ' scope="col">'

    content = re.sub(r'<th[^>]*>', add_scope_to_th, content, flags=re.IGNORECASE)

    # Add semantic structure to tables that don't have it
    def add_table_structure(match):
        table_inner = match.group(1)

        # Skip if already has proper structure
        if '<thead>' in table_inner or '<tbody>' in table_inner:
            return match.group(0)

        # Find all <tr> tags
        tr_pattern = r'<tr[^>]*>.*?</tr>'
        tr_matches = re.findall(tr_pattern, table_inner, re.DOTALL | re.IGNORECASE)

        if len(tr_matches) < 2:
            return match.group(0)  # Need at least header + data rows

        first_tr = tr_matches[0]

        # Check if first row has <th> elements
        if '<th' in first_tr:
            # Create thead
            thead_content = f'<thead>\n{first_tr}\n</thead>'

            # Create tbody with remaining rows
            remaining_rows = '\n'.join(tr_matches[1:])
            tbody_content = f'<tbody>\n{remaining_rows}\n</tbody>'

            # Replace the table content
            new_table_inner = table_inner.replace(first_tr, '', 1)
            # Remove the remaining tr tags that are now in tbody
            for tr in tr_matches[1:]:
                new_table_inner = new_table_inner.replace(tr, '', 1)

            new_table_inner = thead_content + '\n' + tbody_content + new_table_inner

            return f'<table{new_table_inner}</table>'

        return match.group(0)

    # Apply table structure improvements
    content = re.sub(r'<table([^>]*?)>(.*?)</table>', add_table_structure, content, flags=re.DOTALL | re.IGNORECASE)

    return content

def process_html_file(filepath):
    """Process a single HTML file to improve table accessibility"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Improve table accessibility
        improved_content = improve_table_accessibility(content)

        # Write back if changes were made
        if improved_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(improved_content)
            return True

    except Exception as e:
        print(f"Error processing {filepath}: {str(e)}")
        return False

    return False

def main():
    """Main function to process all HTML files"""
    html_files = []

    # Find all index.html files
    for root, dirs, files in os.walk('.'):
        for file in files:
            if file == 'index.html':
                filepath = os.path.join(root, file)
                html_files.append(filepath)

    updated_count = 0

    for filepath in html_files:
        if process_html_file(filepath):
            print(f"✓ Updated: {filepath}")
            updated_count += 1
        else:
            print(f"⊘ No changes needed: {filepath}")

    print(f"\n✅ Updated {updated_count} files with improved table accessibility")

if __name__ == '__main__':
    main()