# مشرف التعليقات — mesh5al

تطبيق لمراجعة تعليقات يوتيوب المعلّقة: وافق، احذف، أو احظر بنقرة.

## الإعداد

1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com)
2. أنشئ مشروعاً وفعّل **YouTube Data API v3**
3. أنشئ OAuth 2.0 credentials → نوع Web Application
4. أضف `https://<username>.github.io` في Authorized JavaScript origins
5. افتح التطبيق وأدخل الـ Client ID

## التشغيل محلياً

\`\`\`bash
npm install
npm run dev
\`\`\`

## النشر

يتم النشر تلقائياً على GitHub Pages عند كل push على branch main.
