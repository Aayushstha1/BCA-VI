def build_result_notification(exam_name, class_name=None, section=None):
    section_part = f" {section}" if section else ""
    class_part = f"{class_name}{section_part}" if class_name else "your class"
    title = "Result Published"
    content = f"Your result for {exam_name} (Class {class_part}) has been published."
    return {
        "title": title,
        "content": content,
        "link": "/student/report-card",
    }
