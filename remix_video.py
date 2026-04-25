import time
from unicodedata import name
from openai import OpenAI # type: ignore

client = OpenAI()

SOURCE_VIDEO_ID = "video_69ca30772dac81938281124892210a6f01b297d5000fbfb8"

REMIX_PROMPT = """
Create a clean vertical ad video for Khmer AI.
Keep the branding elegant and modern.

Structure:
1) Opening: show Khmer AI logo clearly
2) Middle: show realistic app usage on a smartphone
3) End: show App Store and Google Play download call-to-action

Add Khmer text overlays:
- Khmer AI
- បច្ចេកវិទ្យាឆ្លាតវៃសម្រាប់អ្នក
- សួរអ្វីក៏បាន
- ឆ្លើយបានគ្រប់យ៉ាង
- លឿន និងឆ្លាតវៃ
- ងាយស្រួលប្រើ
- ទាញយកឥឡូវនេះ!

Style:
- professional
- mobile app advertisement
- smooth transitions
- bright, trustworthy, premium look
- readable Khmer text
"""

def main():
    try:
        video = client.videos.remix(
            video_id=SOURCE_VIDEO_ID,
            prompt=REMIX_PROMPT
        )

        print("ส่งคำสั่ง remix แล้ว")
        print("New video id:", video.id)
        print("Status:", video.status)

        while video.status in ("queued", "in_progress"):
            time.sleep(5)
            video = client.videos.retrieve(video.id)
            print("Progress:", getattr(video, "progress", None), "| Status:", video.status)

        if video.status == "completed":
            print("\nวิดีโอเสร็จแล้ว")
            print("Video ID:", video.id)

            content = client.videos.content(video.id)
            with open("khmer_ai_remix.mp4", "wb") as f:
                f.write(content.read())

            print("บันทึกไฟล์เรียบร้อย: khmer_ai_remix.mp4")
        else:
            print("\nวิดีโอไม่สำเร็จ")
            print("Status:", video.status)
            print("Error:", getattr(video, "error", None))

    except Exception as e:
        print("เกิดข้อผิดพลาด:", str(e))

if name == "__main__":
    main()