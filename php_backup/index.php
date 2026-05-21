<?php
session_start();
if (isset($_SESSION['user_id'])) {
    if ($_SESSION['role'] == 'admin') {
        header("Location: admin/dashboard.php");
        exit();
    } else {
        header("Location: user/dashboard.php");
        exit();
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Peak 空 | Conquer The Mountain</title>
    <meta name="description" content="Project Peak 空 - Transform your body with personalized fitness programs, 1-on-1 coaching, and a dedicated community. Conquer your mountain.">
    <link rel="stylesheet" href="assets/css/style.css?v=<?php echo time(); ?>">
    <!-- Phosphor Icons -->
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
</head>
<body>

    <!-- Navigation Bar -->
    <nav class="navbar" id="main-navbar">
        <div class="nav-brand">
            <img src="assets/img/logo.svg" alt="Project Peak Logo">
            <span>Project Peak <span class="kanji">空</span></span>
        </div>
        <button class="mobile-toggle" id="mobileToggle" aria-label="Toggle navigation">
            <i class="ph ph-list"></i>
        </button>
        <div class="nav-links" id="navLinks">
            <a href="#hero" class="active"><i class="ph ph-house"></i> Home</a>
            <a href="#programs"><i class="ph ph-barbell"></i> Programs</a>
            <a href="#coaching"><i class="ph ph-user-focus"></i> PT</a>
            <a href="login.php" class="nav-btn"><i class="ph ph-sign-in"></i> Login</a>
        </div>
    </nav>

    <!-- ========== SECTION 1: HERO ========== -->
    <section class="hero" id="hero">
        <div class="hero-bg"></div>
        <div class="hero-overlay"></div>
        
        <div class="hero-content">
            <p class="hero-tagline">မဖြစ်နိုင်တာမရှိတဲ့ ပန်းတိုင်ဆီသို့။</p>
            <h1 class="bold hero-headline">
                Conquer The<br><span>Mountain.</span>
            </h1>
            <p class="hero-body">
                ခန္ဓာကိုယ်ကို အသစ်ပြန်တည်ဆောက်ပါ။ တောင်ထိပ်ရောက်ဖို့ ကထင်ထားသလို မရှုပ်ဘူး။ အချက် ၄ ချက်ကို ဖြေရှင်းရုံပါပဲ။ မြေပုံအတိအကျနဲ့ လမ်းမှာ ကြုံရမယ့် အခက်အခဲတိုင်းအတွက် အဖြေရှိတယ်။ စတက်ဖို့ ready ပဲလား ကိုယ့်လူတို့ 💪🏻
            </p>
            <div class="btn-group">
                <a href="register.php" class="btn btn-cta"><i class="ph ph-fire"></i> Start Your Journey</a>
                <a href="login.php" class="btn btn-outline"><i class="ph ph-sign-in"></i> Login</a>
            </div>
        </div>

        <!-- Scroll indicator -->
        <div class="scroll-indicator">
            <i class="ph ph-caret-double-down"></i>
        </div>
    </section>



    <!-- ========== SECTION 3: ONE-ON-ONE COACHING ========== -->
    <section class="section-coaching" id="coaching">
        <div class="container">
            <div class="coaching-grid">
                <div class="coaching-info reveal">
                    <span class="section-badge"><i class="ph ph-user-focus"></i> Personal Training</span>
                    <h2>One-on-One <span class="accent">Coaching</span></h2>
                    <p class="coaching-desc">
                        တစ်ယောက်ချင်းစီရဲ့ ခန္ဓာကိုယ်အခြေအနေ၊ ပန်းတိုင်၊ နေ့စဉ်အချိန်ဇယားကို ဂရုတစိုက်လေ့လာပြီး သင့်အတွက်သာ ဖန်တီးထားတဲ့ Plan တစ်ခုနဲ့ အမြင့်ဆုံးရလဒ်ကို ရယူလိုက်ပါ။
                    </p>
                    
                    <div class="service-list">
                        <div class="service-item">
                            <i class="ph-fill ph-check-circle"></i>
                            <span>Customized Workout Plan (လေ့ကျင့်ခန်း အစီအစဉ်)</span>
                        </div>
                        <div class="service-item">
                            <i class="ph-fill ph-check-circle"></i>
                            <span>Personalized Nutrition Guide (အာဟာရ လမ်းညွှန်)</span>
                        </div>
                        <div class="service-item">
                            <i class="ph-fill ph-check-circle"></i>
                            <span>Weekly Check-in & Progress Tracking</span>
                        </div>
                        <div class="service-item">
                            <i class="ph-fill ph-check-circle"></i>
                            <span>Daily Habit Building System</span>
                        </div>
                        <div class="service-item">
                            <i class="ph-fill ph-check-circle"></i>
                            <span>Direct Trainer Messaging & Support</span>
                        </div>
                        <div class="service-item">
                            <i class="ph-fill ph-check-circle"></i>
                            <span>Body Composition Analysis (ခန္ဓာကိုယ် ပိုင်းခြားစိတ်ဖြာ)</span>
                        </div>
                    </div>

                    <a href="register.php" class="btn btn-coaching"><i class="ph ph-lightning"></i> Coaching ယူမယ်</a>
                </div>
                <div class="coaching-visual reveal">
                    <div class="coaching-card-stack">
                        <div class="c-card c-card-1">
                            <i class="ph ph-calendar-check"></i>
                            <h4>Weekly Plan</h4>
                            <p>အပတ်စဉ် Program</p>
                        </div>
                        <div class="c-card c-card-2">
                            <i class="ph ph-chart-line-up"></i>
                            <h4>Progress Track</h4>
                            <p>တိုးတက်မှု မှတ်တမ်း</p>
                        </div>
                        <div class="c-card c-card-3">
                            <i class="ph ph-chats-circle"></i>
                            <h4>Direct Support</h4>
                            <p>တိုက်ရိုက် အကူအညီ</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ========== SECTION 4: PROGRAMS ========== -->
    <section class="section-programs" id="programs">
        <div class="container">
            <div class="section-header reveal">
                <span class="section-badge"><i class="ph ph-barbell"></i> Programs</span>
                <h2>Transformation <span class="accent">Programs</span></h2>
                <p class="section-subtitle">သင့်ရဲ့ ခန္ဓာကိုယ်အမျိုးအစားနဲ့ ပန်းတိုင်ပေါ်မူတည်ပြီး သင့်တော်ဆုံး Program ကို ရွေးချယ်လိုက်ပါ။</p>
            </div>

            <div class="programs-grid">
                <!-- Program 1: Skinnyfat Recomp -->
                <div class="program-card reveal" onclick="openProgramModal('recomp')">
                    <div class="program-card-visual">
                        <img src="user/Skinnyfat.jpg" alt="Skinnyfat Recomp Transformation" class="program-cover-img">
                        <div class="program-badge-float"><i class="ph ph-calendar-check"></i> 12 Weeks</div>
                        <div class="program-cover-shine"></div>
                    </div>
                    <div class="program-card-body">
                        <div class="program-header">
                            <span class="program-tag tag-blue">Body Recomposition</span>
                            <h3>Skinnyfat Recomp</h3>
                            <p class="program-tagline">Soft → Defined</p>
                        </div>
                        <div class="program-includes">
                            <span><i class="ph ph-barbell"></i> Program</span>
                            <span><i class="ph ph-bowl-food"></i> Diet</span>
                            <span><i class="ph ph-list-checks"></i> Habits</span>
                            <span><i class="ph ph-users"></i> Community</span>
                        </div>
                        <div class="program-card-cta">
                            <span>အသေးစိတ်ကြည့်မယ်</span>
                            <i class="ph ph-arrow-right"></i>
                        </div>
                    </div>
                </div>

                <!-- Program 2: Project-20 -->
                <div class="program-card featured reveal" onclick="openProgramModal('project20')">
                    <div class="featured-ribbon"><i class="ph-fill ph-fire"></i> Popular</div>
                    <div class="program-card-visual">
                        <img src="user/project 20.jpg" alt="Project 20 Fat Loss Transformation" class="program-cover-img">
                        <div class="program-badge-float"><i class="ph ph-calendar-check"></i> 12 Weeks</div>
                        <div class="program-cover-shine"></div>
                    </div>
                    <div class="program-card-body">
                        <div class="program-header">
                            <span class="program-tag tag-orange">Fat Loss</span>
                            <h3>Project-20</h3>
                            <p class="program-tagline">20 lbs ချမယ် → Lean Body</p>
                        </div>
                        <div class="program-includes">
                            <span><i class="ph ph-barbell"></i> Program</span>
                            <span><i class="ph ph-bowl-food"></i> Diet</span>
                            <span><i class="ph ph-list-checks"></i> Habits</span>
                            <span><i class="ph ph-users"></i> Community</span>
                        </div>
                        <div class="program-card-cta">
                            <span>အသေးစိတ်ကြည့်မယ်</span>
                            <i class="ph ph-arrow-right"></i>
                        </div>
                    </div>
                </div>

                <!-- Program 3: Mass Method -->
                <div class="program-card reveal" onclick="openProgramModal('mass')">
                    <div class="program-card-visual">
                        <img src="user/mass method.jpg" alt="Mass Method Muscle Building Transformation" class="program-cover-img">
                        <div class="program-badge-float"><i class="ph ph-calendar-check"></i> 12 Weeks</div>
                        <div class="program-cover-shine"></div>
                    </div>
                    <div class="program-card-body">
                        <div class="program-header">
                            <span class="program-tag tag-green">Muscle Building</span>
                            <h3>Mass Method</h3>
                            <p class="program-tagline">Skinny → Muscular</p>
                        </div>
                        <div class="program-includes">
                            <span><i class="ph ph-barbell"></i> Program</span>
                            <span><i class="ph ph-bowl-food"></i> Diet</span>
                            <span><i class="ph ph-list-checks"></i> Habits</span>
                            <span><i class="ph ph-users"></i> Community</span>
                        </div>
                        <div class="program-card-cta">
                            <span>အသေးစိတ်ကြည့်မယ်</span>
                            <i class="ph ph-arrow-right"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ========== SECTION 5: ABOUT US / TRAINER ========== -->
    <section class="section-about" id="about">
        <div class="container">
            <div class="section-header reveal">
                <span class="section-badge"><i class="ph ph-info"></i> About Us</span>
                <h2>Meet Your <span class="accent">Trainer</span></h2>
            </div>

            <div class="about-grid reveal">
                <div class="trainer-photo-wrap">
                    <img src="Ax.jpg" alt="Head Trainer Thet Naing Htun" class="trainer-photo">
                    <div class="trainer-name-tag">
                        <h4>Head Coach</h4>
                        <p>Project Peak 空 Founder</p>
                    </div>
                </div>
                <div class="trainer-info">
                    <h3>ခန္ဓာကိုယ်ပြောင်းလဲရေး Specialist</h3>
                    <p class="trainer-bio">
                        ကျနော်ယုံကြည်တာက — ဘယ်သူမဆို မှန်ကန်တဲ့ Plan နဲ့ Consistency ရှိရင် ခန္ဓာကိုယ်ကို လုံးဝပြောင်းလဲနိုင်ပါတယ်။ Shortcut မရှိပါဘူး။ ဒါပေမယ့် Smart Way ရှိပါတယ်။ Project Peak 空 က သင့်ရဲ့ ခရီးကို ဘယ်တော့မှ တစ်ယောက်တည်း မလျှောက်ရစေဖို့ တည်ဆောက်ထားတာပါ။
                    </p>

                    <div class="credentials-grid">
                        <div class="credential-item">
                            <i class="ph-fill ph-certificate"></i>
                            <div>
                                <strong>Certifications</strong>
                                <p>Certified Personal Trainer (CPT), Sports Nutrition Specialist</p>
                            </div>
                        </div>
                        <div class="credential-item">
                            <i class="ph-fill ph-clock-countdown"></i>
                            <div>
                                <strong>Experience</strong>
                                <p>5+ Years in Body Transformation & Coaching</p>
                            </div>
                        </div>
                        <div class="credential-item">
                            <i class="ph-fill ph-heart"></i>
                            <div>
                                <strong>Philosophy</strong>
                                <p>Sustainable results through discipline, science-based training & proper nutrition</p>
                            </div>
                        </div>
                        <div class="credential-item">
                            <i class="ph-fill ph-star"></i>
                            <div>
                                <strong>Specialties</strong>
                                <p>Body Recomposition, Fat Loss, Muscle Building, Habit Coaching</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ========== SECTION: COMMUNITY (BOTTOM) ========== -->
    <section class="section-community" id="community">
        <div class="container">
            <div class="section-header reveal">
                <span class="section-badge"><i class="ph ph-users-three"></i> Our Community</span>
                <h2>Project Peak <span class="accent">空</span> Community</h2>
                <p class="section-subtitle">တစ်ယောက်တည်းမတက်ပါနဲ့။ ညီအစ်ကိုတွေနဲ့အတူတက်ပါ။ Project Peak Community မှာ တစ်ယောက်ရဲ့ အောင်မြင်မှုက တစ်ယောက်ရဲ့ Motivation ဖြစ်ပါတယ်။</p>
            </div>
            <div class="mountain-image-wrapper reveal">
                <img src="mountain.jpg" alt="Project Peak Mountain Journey" class="mountain-img">
                <div class="mountain-caption"><span>Diet → Training → Habits → Recovery → <strong>THE PEAK 空</strong></span></div>
            </div>
            <div class="community-stats reveal">
                <div class="stat-item"><i class="ph ph-users"></i><span class="stat-number" data-target="150">0</span>+<span class="stat-label">Active Members</span></div>
                <div class="stat-item"><i class="ph ph-trophy"></i><span class="stat-number" data-target="95">0</span>%<span class="stat-label">Success Rate</span></div>
                <div class="stat-item"><i class="ph ph-star"></i><span class="stat-number" data-target="12">0</span><span class="stat-label">Week Programs</span></div>
            </div>
            <div class="text-center reveal"><a href="register.php" class="btn btn-community"><i class="ph ph-hand-fist"></i> Join Our Community</a></div>
        </div>
    </section>

    <!-- ========== PROGRAM DETAIL MODAL ========== -->
    <div class="modal-overlay" id="programModal">
        <div class="modal-content">
            <button class="modal-close" onclick="closeProgramModal()"><i class="ph ph-x"></i></button>
            <div id="modalStep1" class="modal-step active">
                <div class="modal-visual" id="modalVisual"></div>
                <h2 id="modalTitle"></h2>
                <p class="modal-desc" id="modalDesc"></p>
                <div class="modal-what-you-get">
                    <h4>ရရှိမည့်အရာများ</h4>
                    <div class="get-grid" id="modalIncludes"></div>
                </div>
                <div class="modal-price" id="modalPrice"></div>
                <button class="btn btn-cta btn-block" onclick="showSplitStep()"><i class="ph ph-arrow-right"></i> ဆက်သွားမည် (Workout Split ရွေးမယ်)</button>
            </div>
            
            <div id="modalStep2" class="modal-step">
                <h2><i class="ph ph-barbell"></i> Workout Split</h2>
                <p class="modal-desc">သင့် နေထိုင်မှုပုံစံနှင့် အကိုက်ညီဆုံး Workout Split ကို ရွေးချယ်ပါ။</p>
                <div class="split-cards-container">
                    <div class="split-card" onclick="selectSplit('fullbody', this)">
                        <div class="split-card-header">
                            <div class="split-title-row">
                                <i class="ph ph-lightning"></i>
                                <strong>Fullbody Split</strong>
                            </div>
                            <div class="split-radio"><i class="ph ph-check"></i></div>
                        </div>
                        <div class="split-meta">
                            <span><i class="ph ph-clock"></i> 1:30 hr</span>
                            <span><i class="ph ph-calendar"></i> တစ်ပတ် ၃ ရက်</span>
                        </div>
                        <p class="split-desc">ရက်နည်းနည်းနဲ့ တခါထဲအချိန်ပိုပေးနိုင်သူတွေအတွက်</p>
                    </div>

                    <div class="split-card" onclick="selectSplit('ppl', this)">
                        <div class="split-card-header">
                            <div class="split-title-row">
                                <i class="ph ph-fire"></i>
                                <strong>Push / Pull / Legs</strong>
                            </div>
                            <div class="split-radio"><i class="ph ph-check"></i></div>
                        </div>
                        <div class="split-meta">
                            <span><i class="ph ph-clock"></i> 40 min</span>
                            <span><i class="ph ph-calendar"></i> တစ်ပတ် ၆ ရက်</span>
                        </div>
                        <p class="split-desc">တစ်ရက်ကိုအချိန်နည်းနည်းဘဲပေးနိုင်ပေမဲ့ နေ့တိုင်းသွားနိုင်တဲ့သူတွေအတွက် (Gymနဲ့နီးရင်အဆင်ပြေတယ်)</p>
                    </div>

                    <div class="split-card" onclick="selectSplit('upperlower', this)">
                        <div class="split-card-header">
                            <div class="split-title-row">
                                <i class="ph ph-scales"></i>
                                <strong>Upper / Lower</strong>
                            </div>
                            <div class="split-radio"><i class="ph ph-check"></i></div>
                        </div>
                        <div class="split-meta">
                            <span><i class="ph ph-clock"></i> 1 hr</span>
                            <span><i class="ph ph-calendar"></i> တစ်ပတ် ၄ ရက်</span>
                        </div>
                        <p class="split-desc">အများစုနဲ့ အချိန်ကော/recoveryကောအသင့်တော်ဆုံးsplit</p>
                    </div>
                </div>
                <button class="btn btn-cta btn-block" onclick="proceedToPayment()"><i class="ph ph-credit-card"></i> ငွေပေးချေမယ့်အဆင့်သို့</button>
                <button class="btn btn-outline btn-block" onclick="showStep(1)"><i class="ph ph-arrow-left"></i> နောက်သို့</button>
            </div>

            <div id="modalStep3" class="modal-step">
                <h2><i class="ph ph-credit-card"></i> Payment</h2>
                <p class="modal-desc">KBZ Pay QR သို့ ငွေလွှဲပြီး Screenshot ပို့ပေးပါ။</p>
                <div class="qr-payment-box">
                    <div class="qr-img-wrap">
                        <img src="user/kpay TNH.jpg" alt="KPay QR Code" class="qr-img">
                    </div>
                    <div class="qr-info">
                        <div class="pay-phone-box">
                            <div class="pay-phone-label"><i class="ph ph-phone"></i> KPay Phone Number</div>
                            <div class="pay-phone-row">
                                <span id="kpayPhone">09779214809</span>
                                <button class="btn-copy" onclick="copyPhone()" id="copyBtn"><i class="ph ph-copy"></i> Copy</button>
                            </div>
                        </div>
                        <div class="pay-name-box">
                            <i class="ph ph-user-circle"></i>
                            <div>
                                <span class="pay-name-label">Account Name</span>
                                <strong class="pay-name-val">Thet Naing Htun</strong>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="btn btn-cta btn-block" onclick="showFormStep()"><i class="ph ph-check"></i> ငွေလွှဲပြီးပါပြီ</button>
                <button class="btn btn-outline btn-block" onclick="showSplitStep()"><i class="ph ph-arrow-left"></i> နောက်သို့</button>
            </div>

            <div id="modalStep4" class="modal-step">
                <h2><i class="ph ph-clipboard-text"></i> Registration Form</h2>
                <p class="modal-desc">သင့်အချက်အလက်များကို ပြည့်စုံစွာ ဖြည့်ပေးပါ။</p>
                <form class="modal-form" id="regModalForm" onsubmit="submitForm(event)">
                    <div class="form-row">
                        <div class="form-group"><label>အမည် (Name)</label><input type="text" name="username" placeholder="သင့်နာမည်" required></div>
                        <div class="form-group"><label>အသက် (Age)</label><input type="number" name="age" placeholder="25" required></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>အရပ် (Height)</label><input type="text" name="height" placeholder="5'8&quot; or 170cm" required></div>
                        <div class="form-group"><label>ကိုယ်အလေးချိန် (Weight - lbs)</label><input type="number" name="weight" placeholder="160" required></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>အီးမေးလ် (Email)</label><input type="email" name="email" placeholder="yourname@gmail.com" required></div>
                        <div class="form-group"><label>ဖုန်းနံပါတ် (Phone Number)</label><input type="tel" name="phone" placeholder="09-xxx-xxx-xxx" required></div>
                    </div>
                    
                    <div class="form-section-title"><i class="ph ph-camera"></i> ခန္ဓာကိုယ် ဓာတ်ပုံများ (Body Photos)</div>
                    <div class="form-photos-grid">
                        <div class="photo-upload-box">
                            <label>ရှေ့ပိုင်း (Front)</label>
                            <input type="file" name="photo_front" accept="image/*" required>
                        </div>
                        <div class="photo-upload-box">
                            <label>နောက်ပိုင်း (Back)</label>
                            <input type="file" name="photo_back" accept="image/*" required>
                        </div>
                        <div class="photo-upload-box">
                            <label>ဘေးပိုင်း (Side)</label>
                            <input type="file" name="photo_side" accept="image/*" required>
                        </div>
                    </div>

                    <div class="form-group mt-3">
                        <label>ယခု စတင်ဖြစ်သော အကြောင်းရင်း (Reason for starting now)</label>
                        <textarea name="notes" rows="3" placeholder="သင့်ရဲ့ အဓိက ရည်မှန်းချက်နဲ့ ယခုပရိုဂရမ်ကို စတင်ချင်တဲ့ အကြောင်းရင်းကို မျှဝေပေးပါ..." required></textarea>
                    </div>

                    <div class="form-group">
                        <label>ငွေလွှဲပြေစာ (Payment Screenshot)</label>
                        <input type="file" name="payment_screenshot" accept="image/*" required>
                    </div>

                    <button type="submit" class="btn btn-cta btn-block"><i class="ph ph-paper-plane-tilt"></i> အတည်ပြု၍ ပေးပို့မည် (Submit)</button>
                </form>
                <button class="btn btn-outline btn-block" onclick="showPaymentStep()"><i class="ph ph-arrow-left"></i> နောက်သို့</button>
            </div>

            <div id="modalStep5" class="modal-step">
                <div class="success-animation"><i class="ph ph-check-circle"></i></div>
                <h2>ဖောင်ပေးပို့မှု အောင်မြင်ပါသည်!</h2>
                <p class="modal-desc">သင့်အချက်အလက်များကို Admin Account တွင် သိမ်းဆည်းပြီးဖြစ်ပါသည်။<br>လုပ်ငန်းစဉ် အမြန်ဆုံး ပြီးမြောက်စေရန် အောက်ပါ <strong>Telegram Link</strong> သို့ နှိပ်၍ Head Coach (@axx21212) ထံသို့ ငွေလွှဲပြေစာနှင့် ဓာတ်ပုံများကို တိုက်ရိုက် ပေးပို့ပေးပါခင်ဗျာ။</p>
                
                <div class="telegram-box mt-3 mb-3" style="background: #f0fdf4; border: 2px solid #22c55e; padding: 1.5rem; border-radius: 16px; text-align: center;">
                    <i class="ph ph-telegram-logo" style="font-size: 3.5rem; color: #22c55e; margin-bottom: 0.5rem; display: inline-block;"></i>
                    <h3 style="color: #166534; margin-bottom: 0.5rem;">Telegram သို့ ဆက်သွယ်ရန်</h3>
                    <p style="color: #15803d; font-size: 0.95rem; margin-bottom: 1.2rem;">Head Coach (@axx21212) ၏ တရားဝင် Telegram Account သို့ တိုက်ရိုက် ရောက်ရှိမည်ဖြစ်ပါသည်။</p>
                    <a href="https://t.me/axx21212" target="_blank" class="btn btn-cta" style="background: #22c55e; color: #fff; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.8rem 2rem; font-size: 1.1rem; border-radius: 50px; box-shadow: 0 10px 25px rgba(34,197,94,0.3);">
                        <i class="ph ph-paper-plane-right"></i> @axx21212 သို့ ပေးပို့မည် (Open Telegram)
                    </a>
                </div>

                <div class="success-includes">
                    <span><i class="ph ph-barbell"></i> Program</span>
                    <span><i class="ph ph-bowl-food"></i> Diet Plan</span>
                    <span><i class="ph ph-list-checks"></i> Habit Tracker</span>
                    <span><i class="ph ph-users"></i> Community Access</span>
                </div>
                <button class="btn btn-outline btn-block" onclick="closeProgramModal()"><i class="ph ph-house"></i> ပင်မစာမျက်နှာသို့ ပြန်သွားမည်</button>
            </div>
        </div>
    </div>

    <!-- ========== FOOTER ========== -->
    <footer class="site-footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-brand">
                    <img src="assets/img/logo.svg" alt="Project Peak Logo">
                    <span>Project Peak <span class="kanji">空</span></span>
                </div>
                <p>မဖြစ်နိုင်တာမရှိတဲ့ ပန်းတိုင်ဆီသို့။</p>
                <div class="footer-links">
                    <a href="#hero">Home</a>
                    <a href="#programs">Programs</a>
                    <a href="#coaching">PT</a>
                    <a href="#about">About</a>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2026 Project Peak 空. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <script>
    // ===== SMOOTH SCROLL =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            // Close mobile nav
            document.getElementById('navLinks').classList.remove('open');
        });
    });

    // ===== MOBILE NAV TOGGLE =====
    document.getElementById('mobileToggle').addEventListener('click', () => {
        document.getElementById('navLinks').classList.toggle('open');
    });

    // ===== NAVBAR SCROLL EFFECT =====
    const navbar = document.getElementById('main-navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // ===== ACTIVE NAV LINK ON SCROLL =====
    const sections = document.querySelectorAll('section[id]');
    const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            if (scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });
        navAnchors.forEach(a => {
            a.classList.remove('active');
            if (a.getAttribute('href') === '#' + current) {
                a.classList.add('active');
            }
        });
    });

    // ===== SCROLL REVEAL ANIMATION =====
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    revealElements.forEach(el => revealObserver.observe(el));

    // ===== COUNTER ANIMATION =====
    const statNumbers = document.querySelectorAll('.stat-number');
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = +entry.target.getAttribute('data-target');
                let count = 0;
                const increment = Math.ceil(target / 60);
                const timer = setInterval(() => {
                    count += increment;
                    if (count >= target) {
                        entry.target.textContent = target;
                        clearInterval(timer);
                    } else {
                        entry.target.textContent = count;
                    }
                }, 30);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(el => counterObserver.observe(el));

    // ===== PROGRAM MODAL =====
    const programData = {
        recomp: {
            title: 'Skinnyfat Recomp Program',
            desc: 'အဆီကျပြီး ကြွက်သားတက်ချင်တဲ့သူတွေအတွက် ဖန်တီးထားတဲ့ 12 ပတ် Body Recomposition Program။ Soft body ကနေ Defined physique ဆီ ပြောင်းလဲပေးမယ်။ Fat Loss နဲ့ Muscle Gain ကို တပြိုင်နက် ရရှိနိုင်ပါတယ်။',
            price: '50,000 MMK',
            color: '#0ea5e9',
            visual: '<div class="modal-cover-wrap"><img src="user/Skinnyfat.jpg" alt="Skinnyfat Recomp"><div class="modal-cover-tag" style="background: rgba(14,165,233,0.8);">Body Recomposition</div></div>',
            includes: [
                {icon:'ph-barbell', title:'Workout Program', desc:'12 ပတ်စာ Progressive Overload Plan'},
                {icon:'ph-bowl-food', title:'Diet Plan', desc:'Macro-based Nutrition Protocol'},
                {icon:'ph-list-checks', title:'Habit Tracker', desc:'နေ့စဉ် Habit Building System'},
                {icon:'ph-users', title:'Community', desc:'စိတ်တူကိုယ်တူ Support Group'}
            ]
        },
        project20: {
            title: 'Project-20 Program',
            desc: 'ကိုယ်အလေးချိန် 20 ပေါင်ကနေ အနည်းဆုံး 15 ပေါင်အထိ ကျချပေးမယ့် 12 ပတ် Fat Loss Program။ Cardio + Weight Training ပေါင်းစပ်ပြီး အစားအသောက် ထိန်းချုပ်ခြင်းနဲ့ ရလဒ်ကောင်းရအောင် ကူညီပေးမယ်။',
            price: '50,000 MMK',
            color: '#f97316',
            visual: '<div class="modal-cover-wrap"><img src="user/project 20.jpg" alt="Project 20"><div class="modal-cover-tag" style="background: rgba(249,115,22,0.8);">Fat Loss</div></div>',
            includes: [
                {icon:'ph-barbell', title:'Workout Program', desc:'Cardio + Strength Hybrid Training'},
                {icon:'ph-bowl-food', title:'Diet Plan', desc:'Macro-based Calorie Deficit Plan'},
                {icon:'ph-list-checks', title:'Habit Tracker', desc:'Daily Habits & Progress Logging'},
                {icon:'ph-users', title:'Community', desc:'စိတ်တူကိုယ်တူ Support Group'}
            ]
        },
        mass: {
            title: 'Mass Method Program',
            desc: 'ကြွက်သားတက်ချင်တဲ့ Hardgainer တွေအတွက် 12 ပတ် Hypertrophy Program။ Caloric Surplus Diet Plan နဲ့ Progressive Overload Training ပေါင်းစပ်ထားပြီး Skinny ကနေ Muscular physique ဆီ ပြောင်းလဲပေးမယ်။',
            price: '50,000 MMK',
            color: '#22c55e',
            visual: '<div class="modal-cover-wrap"><img src="user/mass method.jpg" alt="Mass Method"><div class="modal-cover-tag" style="background: rgba(34,197,94,0.8);">Muscle Building</div></div>',
            includes: [
                {icon:'ph-barbell', title:'Workout Program', desc:'Hypertrophy-focused Training'},
                {icon:'ph-bowl-food', title:'Diet Plan', desc:'Caloric Surplus Meal Plan'},
                {icon:'ph-list-checks', title:'Habit Tracker', desc:'Rest & Recovery Tracking'},
                {icon:'ph-users', title:'Community', desc:'စိတ်တူကိုယ်တူ Support Group'}
            ]
        }
    };

    function openProgramModal(key) {
        const d = programData[key];
        document.getElementById('modalVisual').innerHTML = d.visual;
        document.getElementById('modalTitle').textContent = d.title;
        document.getElementById('modalDesc').textContent = d.desc;
        document.getElementById('modalPrice').innerHTML = '<i class="ph ph-tag"></i> စျေးနှုန်း: <strong>' + d.price + '</strong>';
        let inc = '';
        d.includes.forEach(i => {
            inc += '<div class="get-item"><i class="ph ' + i.icon + '"></i><strong>' + i.title + '</strong><span>' + i.desc + '</span></div>';
        });
        document.getElementById('modalIncludes').innerHTML = inc;
        document.getElementById('programModal').classList.add('active');
        document.body.style.overflow = 'hidden';
        showStep(1);
    }
    function closeProgramModal() {
        document.getElementById('programModal').classList.remove('active');
        document.body.style.overflow = '';
    }
    function showStep(n) {
        document.querySelectorAll('.modal-step').forEach(s => s.classList.remove('active'));
        document.getElementById('modalStep' + n).classList.add('active');
    }
    let selectedSplit = '';
    function selectSplit(split, el) {
        selectedSplit = split;
        document.querySelectorAll('.split-card').forEach(c => c.classList.remove('selected'));
        el.classList.add('selected');
    }
    function showSplitStep() { showStep(2); }
    function proceedToPayment() {
        if (!selectedSplit) {
            alert('ကျေးဇူးပြု၍ မိမိနှင့် အကိုက်ညီဆုံး Workout Split တစ်ခုကို ရွေးချယ်ပေးပါ။');
            return;
        }
        showStep(3);
    }
    function showPaymentStep() { showStep(3); }
    function showFormStep() { showStep(4); }
    function backToOverview() { showStep(1); }
    function backToSplit() { showStep(2); }
    function backToPayment() { showStep(3); }
    function submitForm(e) { 
        e.preventDefault(); 
        const form = e.target;
        const formData = new FormData(form);
        formData.append('workout_split', selectedSplit || 'Fullbody');
        
        const btn = form.querySelector('button[type="submit"]');
        const origText = btn.innerHTML;
        btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> ပေးပို့နေပါသည်... (Submitting)';
        btn.disabled = true;

        fetch('api/save_registration.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            btn.innerHTML = origText;
            btn.disabled = false;
            if (data.success) {
                showStep(5);
                window.open('https://t.me/axx21212', '_blank');
            } else {
                alert(data.error || 'ဖောင်ပေးပို့ရာတွင် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။');
            }
        })
        .catch(err => {
            btn.innerHTML = origText;
            btn.disabled = false;
            alert('ကွန်ရက် အမှားအယွင်း ဖြစ်ပေါ်နေပါသည်။ ကျေးဇူးပြု၍ ထပ်မံကြိုးစားကြည့်ပါ။');
        });
    }
    function copyPhone() {
        const phone = document.getElementById('kpayPhone').textContent;
        navigator.clipboard.writeText(phone).then(() => {
            const btn = document.getElementById('copyBtn');
            btn.innerHTML = '<i class="ph ph-check"></i> Copied!';
            btn.classList.add('copied');
            setTimeout(() => {
                btn.innerHTML = '<i class="ph ph-copy"></i> Copy';
                btn.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            alert('Failed to copy: ' + err);
        });
    }
    document.getElementById('programModal').addEventListener('click', function(e) {
        if (e.target === this) closeProgramModal();
    });
    </script>

</body>
</html>
