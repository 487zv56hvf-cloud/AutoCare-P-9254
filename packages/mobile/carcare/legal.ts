import type { Lang } from "./i18n";

/** Shared by the website's public /privacy page. The phone app links to that page. */
export const PRIVACY_UPDATED = "2026-10-12";

export type PolicySection = { h: string; p: string[] };

/** `{email}` is replaced with the contact address. */
export const PRIVACY: Record<Lang, { title: string; intro: string; sections: PolicySection[] }> = {
  en: {
    title: "AutoCare Privacy Policy",
    intro:
      "AutoCare helps drivers keep track of mileage and car maintenance. This policy explains what data the AutoCare app and website collect, why, who it is shared with, how long it is kept and how you can delete it.",
    sections: [
      {
        h: "1. Who we are",
        p: [
          "AutoCare (\"we\", \"us\") is run by the AutoCare team. Contact us at {email} for any privacy question or request.",
        ],
      },
      {
        h: "2. Data we collect",
        p: [
          "Account: your email address and name, and how you sign in (Apple, Google or email and password). Passwords are stored only as a secure hash. With Sign in with Apple you can choose to hide your email; we then only receive Apple's private relay address.",
          "Car details you enter: make, model, engine, year, oil type, service intervals, odometer readings, service dates, kilometres and notes, and, only if you type them, the VIN (chassis number) and plate number.",
          "Support chat: the messages you send and the make and model of the car you are viewing.",
          "Feedback: your message, optional rating, optional contact details you type, the car you were viewing and the app language.",
          "Usage statistics: anonymous page and screen views collected without cookies or advertising identifiers. They are not linked to your account.",
          "On your device: your cars, your language and reminder settings, your support chat and your sign-in token (kept in the device's secure storage). Service reminders are scheduled on your phone; notification permission is asked only when you turn reminders on.",
          "We do not collect your location, contacts, photos, payment details or advertising identifiers. We do not show ads, we do not track you across other companies' apps or websites, and we do not sell your data.",
        ],
      },
      {
        h: "3. How we use it",
        p: [
          "To create and secure your account; to back up your cars and keep them in sync between your phone and the website; to calculate maintenance estimates and reminders; to answer your support questions and feedback; and to fix problems and improve AutoCare. We do not use your data for advertising or profiling.",
        ],
      },
      {
        h: "4. Who we share it with",
        p: [
          "Runable (and its database provider Turso): hosts the app's servers and database and provides sign-in and the AI gateway.",
          "Resend: delivers email to the AutoCare team when you send feedback or when a support chat needs a person. The email contains that message and the email address of your account.",
          "Apple or Google: only if you choose to sign in with them. They confirm who you are and give us your name and email.",
          "Google Gemini (AI provider): when you use the support chat, your messages and car make/model are sent to write the reply. The app asks for your permission before the first message, and the chat cannot be used without it.",
          "OneDollarStats: anonymous usage statistics as described above.",
          "These providers process data only to provide their service to us and must protect it at least as well as this policy requires. We may also disclose data if the law requires it.",
        ],
      },
      {
        h: "5. How long we keep it and how to delete it",
        p: [
          "We keep your account data while your account exists. Deleted cars are removed from your backup straight away.",
          "Delete your account at any time in the app (Account > Delete account) or on the website (Account > Delete account). This immediately and permanently deletes your account, backed-up cars, service history, support chats, feedback and sign-in sessions from our database, and removes the cars from that device. Copies may remain for a short time in our hosting provider's routine backups until they are overwritten.",
          "If you signed in with Apple, you can also remove AutoCare from your Apple Account in iPhone Settings > your name > Sign-In & Security > Sign in with Apple.",
          "You can also email {email} to ask for a copy of your data, a correction or deletion.",
        ],
      },
      {
        h: "6. Your choices",
        p: [
          "You can edit or delete any car and service record in the app. You can turn reminders off in Settings or in your phone's settings. The support chat is optional: you can decline the AI notice and still read the help questions. To withdraw consent you have given, stop using the feature and email us, or delete your account.",
        ],
      },
      {
        h: "7. Security",
        p: [
          "All traffic between the app and our servers is encrypted (HTTPS). Each account can only read its own cars. Sign out on shared devices.",
        ],
      },
      {
        h: "8. Children",
        p: ["AutoCare is meant for drivers and is not directed at children under 13. We do not knowingly collect data from children."],
      },
      {
        h: "9. Changes",
        p: ["If we change this policy we will update the date below and, for important changes, tell you in the app."],
      },
      {
        h: "10. Contact",
        p: ["{email}"],
      },
    ],
  },
  ar: {
    title: "سياسة الخصوصية لأوتو كير",
    intro:
      "أوتو كير بيساعد السواقين يتابعوا العداد وصيانة العربية. السياسة دي بتشرح البيانات اللي تطبيق وموقع أوتو كير بيجمعوها، وليه، ومين بيشوفها، وبتتحفظ قد إيه، وإزاي تمسحها.",
    sections: [
      {
        h: "١. إحنا مين",
        p: ["أوتو كير (\"إحنا\") بيديره فريق أوتو كير. كلمنا على {email} في أي سؤال أو طلب يخص الخصوصية."],
      },
      {
        h: "٢. البيانات اللي بنجمعها",
        p: [
          "الحساب: إيميلك واسمك وطريقة الدخول (Apple أو Google أو إيميل وكلمة سر). كلمة السر بتتحفظ مشفرة بس. مع تسجيل الدخول باستخدام Apple تقدر تخفي إيميلك، وساعتها بيوصلنا عنوان Apple الخاص بس.",
          "بيانات العربية اللي بتدخلها: الماركة، الموديل، الموتور، السنة، نوع الزيت، مواعيد الصيانة، قراءات العداد، تواريخ الصيانة والكيلومترات والملاحظات، ورقم الشاسيه (VIN) ورقم اللوحة لو كتبتهم بنفسك بس.",
          "محادثة الدعم: الرسايل اللي بتبعتها وماركة وموديل العربية اللي فاتحها.",
          "الملاحظات: رسالتك، والتقييم لو حطيته، وبيانات التواصل لو كتبتها، والعربية اللي كنت فاتحها، ولغة التطبيق.",
          "إحصائيات الاستخدام: مرات فتح الصفحات والشاشات من غير كوكيز ومن غير معرّفات إعلانية، ومش مربوطة بحسابك.",
          "على جهازك: عربياتك، واللغة وإعدادات التذكير، ومحادثة الدعم، ورمز الدخول (محفوظ في التخزين الآمن للجهاز). تذكيرات الصيانة بتتجدول على موبايلك، وإذن الإشعارات بيتطلب بس لما تشغّل التذكيرات.",
          "مش بنجمع موقعك ولا جهات الاتصال ولا الصور ولا بيانات الدفع ولا معرّفات الإعلانات. مفيش إعلانات، ومش بنتتبعك في تطبيقات أو مواقع شركات تانية، ومش بنبيع بياناتك.",
        ],
      },
      {
        h: "٣. بنستخدمها في إيه",
        p: [
          "عشان نعمل حسابك ونأمّنه، ونحفظ عربياتك ونخليها متزامنة بين الموبايل والموقع، ونحسب مواعيد الصيانة والتذكيرات، ونرد على أسئلة الدعم والملاحظات، ونصلح المشاكل ونحسّن أوتو كير. مش بنستخدم بياناتك في إعلانات أو تكوين ملف عنك.",
        ],
      },
      {
        h: "٤. مين بيشوفها",
        p: [
          "Runable (ومزود قاعدة البيانات Turso): بتستضيف سيرفرات التطبيق وقاعدة البيانات وبتقدم تسجيل الدخول وبوابة الذكاء الاصطناعي.",
          "Resend: بيوصّل إيميل لفريق أوتو كير لما تبعت ملاحظة أو لما محادثة دعم تحتاج حد من الفريق. الإيميل فيه الرسالة دي وإيميل حسابك.",
          "Apple أو Google: بس لو اخترت تدخل بيهم. بيأكدوا هويتك وبيدونا اسمك وإيميلك.",
          "Google Gemini (مزود الذكاء الاصطناعي): لما تستخدم محادثة الدعم، رسايلك وماركة وموديل العربية بيتبعتوا عشان يتكتب الرد. التطبيق بيطلب موافقتك قبل أول رسالة، والمحادثة مش بتشتغل من غيرها.",
          "OneDollarStats: إحصائيات استخدام مجهولة زي ما اتشرح فوق.",
          "المزودين دول بيستخدموا البيانات بس عشان يقدمولنا الخدمة، ولازم يحموها على الأقل زي السياسة دي. وممكن نفصح عن بيانات لو القانون طلب ده.",
        ],
      },
      {
        h: "٥. بنحتفظ بيها قد إيه وإزاي تمسحها",
        p: [
          "بنحتفظ ببيانات حسابك طول ما الحساب موجود. العربية اللي بتمسحها بتتشال من النسخة المحفوظة على طول.",
          "تقدر تمسح حسابك في أي وقت من التطبيق (الحساب > امسح الحساب) أو من الموقع (الحساب > امسح الحساب). ده بيمسح فوراً ونهائياً حسابك والعربيات المحفوظة وسجل الصيانة ومحادثات الدعم والملاحظات وجلسات الدخول من قاعدة بياناتنا، وبيشيل العربيات من الجهاز ده. ممكن تفضل نسخ لفترة قصيرة في النسخ الاحتياطية العادية عند مزود الاستضافة لحد ما تتمسح.",
          "لو دخلت بحساب Apple، تقدر كمان تشيل أوتو كير من حساب Apple من إعدادات الآيفون > اسمك > تسجيل الدخول والأمان > تسجيل الدخول باستخدام Apple.",
          "وتقدر تبعت على {email} تطلب نسخة من بياناتك أو تصحيحها أو مسحها.",
        ],
      },
      {
        h: "٦. اختياراتك",
        p: [
          "تقدر تعدّل أو تمسح أي عربية أو سجل صيانة من التطبيق. وتقدر تقفل التذكيرات من الإعدادات أو من إعدادات الموبايل. محادثة الدعم اختيارية: تقدر ترفض تنبيه الذكاء الاصطناعي وتقرا أسئلة المساعدة عادي. عشان تسحب موافقة اديتها، بطّل تستخدم الميزة وابعتلنا، أو امسح حسابك.",
        ],
      },
      {
        h: "٧. الأمان",
        p: ["كل الاتصال بين التطبيق وسيرفراتنا مشفر (HTTPS). كل حساب يقدر يشوف عربياته بس. سجل خروج على الأجهزة المشتركة."],
      },
      {
        h: "٨. الأطفال",
        p: ["أوتو كير معمول للسواقين ومش موجه للأطفال تحت ١٣ سنة. ومش بنجمع بيانات أطفال عن قصد."],
      },
      {
        h: "٩. التغييرات",
        p: ["لو غيرنا السياسة دي هنحدّث التاريخ اللي تحت، ولو التغيير مهم هنقولك في التطبيق."],
      },
      {
        h: "١٠. التواصل",
        p: ["{email}"],
      },
    ],
  },
};
