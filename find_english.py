import os
import re

def is_vietnamese(text):
    vn_chars = set('àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ')
    for c in text:
        if c in vn_chars:
            return True
    return False

def check_errors():
    src_dir = 'C:/Users/Admin/Documents/worksphere/src'
    pattern = re.compile(r"(toast\.(?:error|success)|setError|throw new Error|errorResponse)\(\s*['\"]+([^'\"]+)['\"]+")
    
    results = []
    
    for root, dirs, files in os.walk(src_dir):
        if 'node_modules' in root.split(os.sep): continue
        for file in files:
            if file.endswith('.ts') or file.endswith('.tsx'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    
                matches = pattern.finditer(content)
                for match in matches:
                    func = match.group(1)
                    msg = match.group(2)
                    
                    # exclude variable names or very short non-word strings
                    if len(msg) < 3 or msg.startswith('$'): continue
                    
                    # check if english or generic
                    is_vn = is_vietnamese(msg)
                    is_generic = msg.lower() in ['có lỗi xảy ra', 'lỗi hệ thống', 'lỗi kết nối máy chủ', 'đã có lỗi xảy ra']
                    is_english = not is_vn and re.search(r'[A-Za-z]', msg)
                    
                    if is_english or is_generic:
                        results.append(f"{os.path.relpath(filepath, src_dir)}: {func}('{msg}')")
    
    with open('C:/Users/Admin/Documents/worksphere/english_errors.txt', 'w', encoding='utf-8') as f:
        f.write("\n".join(results))
    print(f"Found {len(results)} potential english/generic errors")

check_errors()
