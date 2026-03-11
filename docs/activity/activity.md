# Activity Diagram Guide (PlantUML)

## 1. Activity Diagram là gì

**Activity Diagram** là một loại sơ đồ trong UML dùng để mô tả **luồng hoạt động (workflow)** của một chức năng hoặc một quy trình trong hệ thống.

Sơ đồ này thể hiện:

* Trình tự các bước xử lý
* Các điều kiện rẽ nhánh
* Các bước xử lý của hệ thống và người dùng
* Điểm bắt đầu và điểm kết thúc của quy trình

Activity Diagram thường được sử dụng để mô tả:

* Luồng của **Use Case**
* Quy trình nghiệp vụ
* Luồng xử lý của hệ thống

Ví dụ:

* Luồng đăng nhập
* Quy trình tạo công việc
* Quy trình duyệt dự án
* Quy trình upload file

---

# 2. Các thành phần chính của Activity Diagram

| Thành phần | Ý nghĩa                      |
| ---------- | ---------------------------- |
| Start      | Điểm bắt đầu của quy trình   |
| Activity   | Một bước xử lý               |
| Decision   | Rẽ nhánh theo điều kiện      |
| Merge      | Gộp các nhánh                |
| Fork       | Chia luồng xử lý song song   |
| Join       | Hợp nhất các luồng song song |
| End        | Kết thúc quy trình           |

---

# 3. Quy tắc quan trọng nhất khi vẽ Activity Diagram

⚠ **Một Activity Diagram chuẩn chỉ nên có:**

* **1 Start**
* **1 End**

Trong UML:

* **Start** → hình **chấm tròn đen**
* **End** → hình **chấm tròn đen có vòng tròn bao ngoài**

```
●  Start
◎  End
```

Trong **PlantUML**:

```
start
stop
```

Ví dụ:

```
@startuml

start
:User mở trang đăng nhập;
:User nhập email và mật khẩu;
stop

@enduml
```

Quy tắc:

1. Chỉ **1 start duy nhất**
2. Chỉ **1 end duy nhất**
3. Không nên có nhiều điểm kết thúc khác nhau
4. Mọi luồng xử lý phải dẫn về **end**

---

# 4. Cấu trúc cơ bản khi vẽ bằng PlantUML

Mọi sơ đồ Activity bằng PlantUML đều có cấu trúc:

```
@startuml

start

:Các bước xử lý;

stop

@enduml
```

Ví dụ:

```
@startuml

start

:User mở hệ thống;
:User đăng nhập;
:Hệ thống chuyển đến dashboard;

stop

@enduml
```

---

# 5. Cách viết Activity (bước xử lý)

Một bước xử lý được viết như sau:

```
:Tên hành động;
```

Ví dụ:

```
:Nhập email;
:Nhập mật khẩu;
:Nhấn nút đăng nhập;
:Hệ thống kiểm tra thông tin;
```

Quy tắc:

* Kết thúc bằng dấu `;`
* Tên nên **ngắn gọn**
* Bắt đầu bằng **động từ**

Ví dụ đúng:

* Nhập thông tin đăng nhập
* Kiểm tra dữ liệu
* Tạo công việc
* Cập nhật trạng thái

Ví dụ không nên dùng:

* Bước 1
* Xử lý
* Thao tác

---

# 6. Decision (rẽ nhánh điều kiện)

Khi có điều kiện, sử dụng cấu trúc `if`.

Cú pháp:

```
if (điều kiện?) then (Yes)

    :Xử lý khi đúng;

else (No)

    :Xử lý khi sai;

endif
```

Ví dụ:

```
@startuml

start

:User nhập thông tin đăng nhập;

if (Thông tin hợp lệ?) then (Yes)

    :Đăng nhập thành công;

else (No)

    :Hiển thị lỗi đăng nhập;

endif

stop

@enduml
```

---

# 7. Nhiều nhánh điều kiện

Có thể dùng `elseif`.

```
if (Vai trò?) then (Admin)

    :Truy cập trang quản trị;

elseif (Manager)

    :Truy cập trang quản lý;

else (User)

    :Truy cập trang người dùng;

endif
```

---

# 8. Vòng lặp (Loop)

Khi một hành động có thể lặp lại, dùng `while`.

```
while (Chưa nhập đúng?)

    :Nhập lại mật khẩu;

endwhile
```

Ví dụ:

```
@startuml

start

while (Mật khẩu sai?)

:Nhập lại mật khẩu;

endwhile

:Đăng nhập thành công;

stop

@enduml
```

---

# 9. Xử lý song song (Parallel)

Khi có nhiều xử lý xảy ra cùng lúc, dùng `fork`.

```
fork

:Upload file;

fork again

:Gửi thông báo;

end fork
```

Ví dụ:

```
@startuml

start

fork
:Upload file;
fork again
:Gửi thông báo;
end fork

:Hoàn tất xử lý;

stop

@enduml
```

---

# 10. Swimlane (phân vai)

Swimlane giúp phân chia trách nhiệm giữa:

* User
* System
* Admin
* Manager

Cú pháp:

```
|Actor|
:Action;
```

Ví dụ:

```
@startuml

|User|

start
:Nhập email;
:Nhập mật khẩu;

|System|

:Kiểm tra thông tin;

if (Hợp lệ?) then (Yes)

    :Tạo session;
    :Chuyển đến dashboard;

else (No)

    :Trả lỗi đăng nhập;

endif

|User|

:Nhận kết quả;

stop

@enduml
```

---

# 11. Ví dụ Activity Diagram hoàn chỉnh

```
@startuml

|User|

start

:Nhập email;
:Nhập mật khẩu;
:Nhấn nút đăng nhập;

|System|

:Kiểm tra thông tin đăng nhập;

if (Thông tin hợp lệ?) then (Yes)

    :Tạo session;
    :Chuyển hướng đến Dashboard;

else (No)

    :Hiển thị thông báo lỗi;

endif

|User|

:Nhận kết quả;

stop

@enduml
```

---

# 12. Quy tắc thiết kế Activity Diagram

Khi vẽ Activity Diagram cần tuân thủ:

1. Chỉ **1 Start (●)**
2. Chỉ **1 End (◎)**
3. Các bước xử lý phải **ngắn gọn**
4. Điều kiện phải có **Yes / No**
5. Không nên quá **15–20 activity trong một sơ đồ**
6. Swimlane dùng để phân chia **vai trò**
7. Tất cả luồng phải dẫn về **End**

---

# 13. Mẫu template nhanh

Template chuẩn để tạo Activity Diagram:

```
@startuml

|Actor|

start

:Thực hiện hành động;

|System|

:Tiếp nhận yêu cầu;
:Kiểm tra dữ liệu;

if (Điều kiện hợp lệ?) then (Yes)

    :Xử lý nghiệp vụ;
    :Lưu dữ liệu;

else (No)

    :Trả lỗi;

endif

|Actor|

:Nhận kết quả;

stop

@enduml
```

---

# Kết luận

Activity Diagram giúp mô tả **luồng hoạt động của hệ thống một cách trực quan và dễ hiểu**.

Khi vẽ bằng PlantUML:

* Viết sơ đồ bằng **code**
* Dễ chỉnh sửa
* Dễ quản lý bằng **Git**
* Dễ tích hợp vào tài liệu **Markdown**

⚠ Luôn nhớ quy tắc quan trọng nhất:

**Một Activity Diagram chỉ có 1 Start và 1 End.**
