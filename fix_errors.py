import json
import os
import re

with open('C:/Users/Admin/Documents/worksphere/catch_blocks.json', 'r', encoding='utf-8') as f:
    blocks = json.load(f)

report_lines = []
report_lines.append("# Báo cáo Kiểm tra Xử lý Lỗi (Error Handling Report)\n")

updates = {}

for b in blocks:
    filepath = b['file']
    line_num = b['line']
    snip = b['snippet'].lower()
    
    # only check frontend files
    if 'components' not in filepath and '(frontend)' not in filepath:
        continue
        
    status = ""
    current_handling = ""
    issue_type = ""
    
    has_toast = 'toast' in snip
    has_set_error = 'seterror' in snip
    has_console = 'console.error' in snip
    
    if not has_toast and not has_set_error:
        if has_console:
            current_handling = "Chỉ ghi log (console.error)"
        else:
            current_handling = "Không có xử lý (swallowed)"
        status = "❌ Không hiển thị cho người dùng"
        issue_type = "missing"
    else:
        if "có lỗi xảy ra" in snip or "lỗi xảy ra" in snip or "có lỗi" in snip or "đã xảy ra lỗi" in snip or "lỗi kết nối" in snip:
            current_handling = "Hiển thị thông báo chung chung (Generic popup)"
            status = "⚠️ Thông báo quá chung chung"
            issue_type = "generic"
        else:
            current_handling = "Hiển thị thông báo cụ thể"
            status = "✅ Đã có thông báo cụ thể"
            issue_type = "ok"

    if issue_type != "ok":
        report_lines.append(f"- **File:** {os.path.basename(filepath)}:{line_num}")
        report_lines.append(f"  - **Hiện tại:** {current_handling}")
        report_lines.append(f"  - **Trạng thái:** {status}")
        
        # Decide fixing strategy
        # Find exactly what function it is in based on the file content
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        lines = content.split('\n')
        # Try to guess context from lines before catch
        context = " ".join(lines[max(0, line_num-7):line_num])
        
        context_action = "xử lý dữ liệu"
        if "fetch(" in context or "get" in context.lower(): context_action = "tải dữ liệu"
        if "update" in context.lower() or "put" in context.lower() or "edit" in context.lower(): context_action = "cập nhật dữ liệu"
        if "delete" in context.lower() or "remove" in context.lower(): context_action = "xóa dữ liệu"
        if "create" in context.lower() or "post" in context.lower() or "add" in context.lower(): context_action = "tạo mới dữ liệu"
        if "login" in context.lower() or "auth" in context.lower(): context_action = "xác thực"
        
        # Map specific contexts
        if "activity" in filepath.lower(): context_action = "tải lịch sử hoạt động"
        if "project" in filepath.lower() and "list" in filepath.lower(): context_action = "thao tác với dự án"
        if "member" in filepath.lower(): context_action = "quản lý thành viên"
        if "notification" in filepath.lower(): context_action = "lấy thông báo"
        if "export" in filepath.lower(): context_action = "xuất báo cáo"
        
        custom_msg = f"Không thể {context_action}. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau."
        if issue_type == "missing":
            if 'import { toast' not in content and 'import {toast' not in content:
                # Add import if missing
                updates[filepath] = updates.get(filepath, content)
                # insert import toast
                if "import" in updates[filepath]:
                    updates[filepath] = updates[filepath].replace("import { useState", "import { toast } from 'sonner';\nimport { useState")
            
            # replace in the snippet
            catch_line = lines[line_num - 1]
            if "catch (error:" in catch_line or "catch (e:" in catch_line or "catch (err:" in catch_line:
                # TS types present
                lines[line_num] = f"            toast.error(error?.message || '{custom_msg}');\n" + lines[line_num]
            else:
                lines[line_num] = f"            toast.error('{custom_msg}');\n" + lines[line_num]
            
            updates[filepath] = "\n".join(lines)
            
        elif issue_type == "generic":
             # regex replace generic messages
            updates[filepath] = updates.get(filepath, content)
            updates[filepath] = re.sub(r"(['\"])Có lỗi xảy ra(?: khi \w+)?(['\"])", f"\\1{custom_msg}\\2", updates[filepath])
            updates[filepath] = re.sub(r"(['\"])Lỗi kết nối(?: máy chủ)?(['\"])", f"\\1{custom_msg}\\2", updates[filepath])
            updates[filepath] = re.sub(r"(['\"])Đã xảy ra lỗi(['\"])", f"\\1{custom_msg}\\2", updates[filepath])
            updates[filepath] = re.sub(r"(['\"])Có lỗi cập nhật(['\"])", f"\\1Không thể cập nhật. Vui lòng thử lại sau.\\2", updates[filepath])

for path, new_content in updates.items():
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)

with open('C:/Users/Admin/Documents/worksphere/error_report.md', 'w', encoding='utf-8') as f:
    f.write("\n".join(report_lines))
    
print(f"Generated report and updated {len(updates)} files.")
