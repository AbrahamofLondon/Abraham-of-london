#!/usr/bin/env python3
"""
fix-mdx-encoding.py
Detects and removes invisible Unicode characters that break MDX parsers.
Forces UTF-8 (No BOM) encoding for Windows compatibility.
"""

import os
import sys
from pathlib import Path

# Problematic Unicode characters that cause "Invalid code point" errors
PROBLEMATIC_CHARS = {
    '\u200B': 'ZERO WIDTH SPACE',
    '\u200C': 'ZERO WIDTH NON-JOINER',
    '\u200D': 'ZERO WIDTH JOINER',
    '\uFEFF': 'ZERO WIDTH NO-BREAK SPACE (BOM)',
    '\u2028': 'LINE SEPARATOR',
    '\u2029': 'PARAGRAPH SEPARATOR',
    '\u00A0': 'NON-BREAKING SPACE',
    '\u202F': 'NARROW NO-BREAK SPACE',
    '\u2060': 'WORD JOINER',
    '\u2018': 'LEFT SINGLE QUOTATION MARK',
    '\u2019': 'RIGHT SINGLE QUOTATION MARK',
    '\u201C': 'LEFT DOUBLE QUOTATION MARK',
    '\u201D': 'RIGHT DOUBLE QUOTATION MARK',
    '\u2013': 'EN DASH',
    '\u2014': 'EM DASH',
}

REPLACEMENTS = {
    '\u2018': "'", '\u2019': "'",
    '\u201C': '"', '\u201D': '"',
    '\u2013': '-', '\u2014': '-',
    '\u00A0': ' ', '\u202F': ' ',
}

def scan_file(filepath):
    try:
        # Read with utf-8-sig to catch BOM, then convert to standard utf-8
        with open(filepath, 'r', encoding='utf-8-sig') as f:
            content = f.read()
        
        issues = []
        for char, name in PROBLEMATIC_CHARS.items():
            if char in content:
                count = content.count(char)
                lines = content.split('\n')
                line_nums = [i+1 for i, line in enumerate(lines) if char in line]
                issues.append({'char': char, 'name': name, 'count': count, 'lines': line_nums[:5]})
        return issues
    except Exception as e:
        return [{'error': str(e)}]

def fix_file(filepath, dry_run=False):
    try:
        with open(filepath, 'r', encoding='utf-8-sig') as f:
            content = f.read()
        
        original_content = content
        changes = []
        
        for char, replacement in REPLACEMENTS.items():
            if char in content:
                changes.append(f"Replaced {content.count(char)}x {PROBLEMATIC_CHARS[char]} with '{replacement}'")
                content = content.replace(char, replacement)
        
        for char in PROBLEMATIC_CHARS:
            if char in content and char not in REPLACEMENTS:
                changes.append(f"Removed {content.count(char)}x {PROBLEMATIC_CHARS[char]}")
                content = content.replace(char, '')
        
        if content != original_content:
            if not dry_run:
                # Backup original
                backup_path = f"{filepath}.backup"
                with open(backup_path, 'w', encoding='utf-8') as f:
                    f.write(original_content)
                
                # Write Clean UTF-8 (No BOM)
                with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
                    f.write(content)
                return {'fixed': True, 'changes': changes, 'backup': backup_path}
            return {'would_fix': True, 'changes': changes}
        return {'fixed': False}
    except Exception as e:
        return {'error': str(e)}

def main():
    if len(sys.argv) < 2:
        print("Usage: python fix-mdx-encoding.py <path> [--fix] [--dry-run]")
        sys.exit(1)
    
    target = Path(sys.argv[1])
    fix_mode = '--fix' in sys.argv
    dry_run = '--dry-run' in sys.argv
    
    files = [target] if target.is_file() else list(target.rglob('*.mdx')) + list(target.rglob('*.md'))
    print(f"--- Institutional Sanitization: {len(files)} files ---")

    for filepath in files:
        issues = scan_file(filepath)
        if issues and 'error' not in issues[0]:
            print(f"❌ {filepath.name}")
            if fix_mode:
                res = fix_file(filepath, dry_run)
                if res.get('fixed') or res.get('would_fix'):
                    for c in res['changes']: print(f"   {c}")
    print("\nScan Complete.")

if __name__ == '__main__':
    main()