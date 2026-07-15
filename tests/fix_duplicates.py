"""Fix duplicate declarations in all pages - removes old first half, keeps new second half"""
import os, re

pages_dir = r"c:\Users\zhy\Desktop\求职\项目经历\XHAgentOS\frontend\src\pages"

for fname in sorted(os.listdir(pages_dir)):
    if not fname.endswith('.tsx'):
        continue
    fpath = os.path.join(pages_dir, fname)
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Count export defaults
    exports = len(re.findall(r'^export default ', content, re.MULTILINE))
    if exports <= 1:
        continue
        
    print(f"\n[FIXING] {fname}: {exports} export defaults")
    
    # Find the second export default's position
    matches = list(re.finditer(r'^export default ', content, re.MULTILINE))
    second_export_pos = matches[1].start()
    
    # Find the import statement closest after the first export default
    # This is where the new content starts
    first_export_end = matches[0].end()
    remaining = content[first_export_end:]
    import_match = re.search(r'^import ', remaining, re.MULTILINE)
    
    if import_match:
        cut_pos = first_export_end + import_match.start()
        new_content = content[cut_pos:]
        print(f"  Removed {cut_pos} chars (lines 1-{content[:cut_pos].count(chr(10))})")
        print(f"  Keeping {len(new_content)} chars")
        
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"  [OK] {fname} fixed")
    else:
        print(f"  [SKIP] No import found after first export")

print("\nDone!")
