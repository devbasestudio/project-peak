"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

interface ProgramDetail {
  title: string;
  desc: string;
  price: string;
  color: string;
  imgSrc: string;
  tag: string;
  tagClass: string;
  includes: { icon: string; title: string; desc: string }[];
}

export default function Home() {
  // Navigation states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [selectedProgramKey, setSelectedProgramKey] = useState<"recomp" | "project20" | "mass">("recomp");
  const [selectedSplit, setSelectedSplit] = useState("");
  const [copyStatus, setCopyStatus] = useState("Copy");

  // Form states
  const [username, setUsername] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [photoFront, setPhotoFront] = useState<File | null>(null);
  const [photoBack, setPhotoBack] = useState<File | null>(null);
  const [photoSide, setPhotoSide] = useState<File | null>(null);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Stats Counters state
  const [statMembers, setStatMembers] = useState(0);
  const [statSuccessRate, setStatSuccessRate] = useState(0);
  const [statPrograms, setStatPrograms] = useState(0);

  const programs: Record<"recomp" | "project20" | "mass", ProgramDetail> = {
    recomp: {
      title: "Skinnyfat Recomp Program",
      desc: "အဆီကျပြီး ကြွက်သားတက်ချင်တဲ့သူတွေအတွက် ဖန်တီးထားတဲ့ 12 ပတ် Body Recomposition Program။ Soft body ကနေ Defined physique ဆီ ပြောင်းလဲပေးမယ်။ Fat Loss နဲ့ Muscle Gain ကို တပြိုင်နက် ရရှိနိုင်ပါတယ်။",
      price: "50,000 MMK",
      color: "#0ea5e9",
      imgSrc: "/user/Skinnyfat.jpg",
      tag: "Body Recomposition",
      tagClass: "tag-blue",
      includes: [
        { icon: "ph-barbell", title: "Workout Program", desc: "12 ပတ်စာ Progressive Overload Plan" },
        { icon: "ph-bowl-food", title: "Diet Plan", desc: "Macro-based Nutrition Protocol" },
        { icon: "ph-list-checks", title: "Habit Tracker", desc: "နေ့စဉ် Habit Building System" },
        { icon: "ph-users", title: "Community", desc: "စိတ်တူကိုယ်တူ Support Group" },
      ],
    },
    project20: {
      title: "Project-20 Program",
      desc: "ကိုယ်အလေးချိန် 20 ပေါင်ကနေ အနည်းဆုံး 15 ပေါင်အထိ ကျချပေးမယ့် 12 ပတ် Fat Loss Program။ Cardio + Weight Training ပေါင်းစပ်ပြီး အစားအသောက် ထိန်းချုပ်ခြင်းနဲ့ ရလဒ်ကောင်းရအောင် ကူညီပေးမယ်။",
      price: "50,000 MMK",
      color: "#f97316",
      imgSrc: "/user/project 20.jpg",
      tag: "Fat Loss",
      tagClass: "tag-orange",
      includes: [
        { icon: "ph-barbell", title: "Workout Program", desc: "Cardio + Strength Hybrid Training" },
        { icon: "ph-bowl-food", title: "Diet Plan", desc: "Macro-based Calorie Deficit Plan" },
        { icon: "ph-list-checks", title: "Habit Tracker", desc: "Daily Habits & Progress Logging" },
        { icon: "ph-users", title: "Community", desc: "စိတ်တူကိုယ်တူ Support Group" },
      ],
    },
    mass: {
      title: "Mass Method Program",
      desc: "ကြွက်သားတက်ချင်တဲ့ Hardgainer တွေအတွက် 12 ပတ် Hypertrophy Program။ Caloric Surplus Diet Plan နဲ့ Progressive Overload Training ပေါင်းစပ်ထားပြီး Skinny ကနေ Muscular physique ဆီ ပြောင်းလဲပေးမယ်။",
      price: "50,000 MMK",
      color: "#22c55e",
      imgSrc: "/user/mass method.jpg",
      tag: "Muscle Building",
      tagClass: "tag-green",
      includes: [
        { icon: "ph-barbell", title: "Workout Program", desc: "Hypertrophy-focused Training" },
        { icon: "ph-bowl-food", title: "Diet Plan", desc: "Caloric Surplus Meal Plan" },
        { icon: "ph-list-checks", title: "Habit Tracker", desc: "Rest & Recovery Tracking" },
        { icon: "ph-users", title: "Community", desc: "စိတ်တူကိုယ်တူ Support Group" },
      ],
    },
  };

  // Scroll effect and active section tracking
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // Track active section
      const sections = ["hero", "coaching", "programs", "about", "community"];
      let current = "hero";
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 150) {
            current = sectionId;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Stats counter animation when visible
  useEffect(() => {
    let membersCount = 0;
    let rateCount = 0;
    let programsCount = 0;

    const membersTimer = setInterval(() => {
      membersCount += 5;
      if (membersCount >= 150) {
        setStatMembers(150);
        clearInterval(membersTimer);
      } else {
        setStatMembers(membersCount);
      }
    }, 30);

    const rateTimer = setInterval(() => {
      rateCount += 3;
      if (rateCount >= 95) {
        setStatSuccessRate(95);
        clearInterval(rateTimer);
      } else {
        setStatSuccessRate(rateCount);
      }
    }, 30);

    const programsTimer = setInterval(() => {
      programsCount += 1;
      if (programsCount >= 12) {
        setStatPrograms(12);
        clearInterval(programsTimer);
      } else {
        setStatPrograms(programsCount);
      }
    }, 80);

    return () => {
      clearInterval(membersTimer);
      clearInterval(rateTimer);
      clearInterval(programsTimer);
    };
  }, []);

  const openProgramModal = (key: "recomp" | "project20" | "mass") => {
    setSelectedProgramKey(key);
    setModalStep(1);
    setSelectedSplit("");
    setModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeProgramModal = () => {
    setModalOpen(false);
    document.body.style.overflow = "";
  };

  const copyPhone = () => {
    navigator.clipboard.writeText("09779214809").then(() => {
      setCopyStatus("Copied!");
      setTimeout(() => setCopyStatus("Copy"), 2000);
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("age", age);
      formData.append("height", height);
      formData.append("weight", weight);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("notes", notes);
      formData.append("workout_split", selectedSplit || "Fullbody");
      formData.append("program_name", programs[selectedProgramKey].title);

      if (photoFront) formData.append("photo_front", photoFront);
      if (photoBack) formData.append("photo_back", photoBack);
      if (photoSide) formData.append("photo_side", photoSide);
      if (paymentScreenshot) formData.append("payment_screenshot", paymentScreenshot);

      const response = await fetch("/api/save-registration", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setModalStep(5);
        window.open("https://t.me/axx21212", "_blank");
      } else {
        alert(data.error || "ဖောင်ပေးပို့ရာတွင် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။");
      }
    } catch (err) {
      alert("ကွန်ရက် အမှားအယွင်း ဖြစ်ပေါ်နေပါသည်။ ကျေးဇူးပြု၍ ထပ်မံကြိုးစားကြည့်ပါ။");
    } finally {
      setSubmitting(false);
    }
  };

  // Scroll smooth handler
  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setMobileMenuOpen(false);
  };

  const currentProgram = programs[selectedProgramKey];

  return (
    <>
      {/* Navigation Bar */}
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`} id="main-navbar">
        <div className="nav-brand">
          <Image src="/img/logo.svg" alt="Project Peak Logo" width={45} height={45} priority />
          <span>Project Peak <span className="kanji">空</span></span>
        </div>
        <button
          className="mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation"
        >
          <i className="ph ph-list"></i>
        </button>
        <div className={`nav-links ${mobileMenuOpen ? "open" : ""}`} id="navLinks">
          <a
            href="#hero"
            className={activeSection === "hero" ? "active" : ""}
            onClick={(e) => handleScrollTo(e, "hero")}
          >
            <i className="ph ph-house"></i> Home
          </a>
          <a
            href="#programs"
            className={activeSection === "programs" ? "active" : ""}
            onClick={(e) => handleScrollTo(e, "programs")}
          >
            <i className="ph ph-barbell"></i> Programs
          </a>
          <a
            href="#coaching"
            className={activeSection === "coaching" ? "active" : ""}
            onClick={(e) => handleScrollTo(e, "coaching")}
          >
            <i className="ph ph-user-focus"></i> PT
          </a>
          <a href="/login" className="nav-btn">
            <i className="ph ph-sign-in"></i> Login
          </a>
        </div>
      </nav>

      {/* ========== SECTION 1: HERO ========== */}
      <section className="hero" id="hero">
        <div className="hero-bg"></div>
        <div className="hero-overlay"></div>

        <div className="hero-content" style={{ opacity: 1, transform: "translateY(0)" }}>
          <p className="hero-tagline">မဖြစ်နိုင်တာမရှိတဲ့ ပန်းတိုင်ဆီသို့။</p>
          <h1 className="bold hero-headline">
            Conquer The<br /><span>Mountain.</span>
          </h1>
          <p className="hero-body">
            ခန္ဓာကိုယ်ကို အသစ်ပြန်တည်ဆောက်ပါ။ တောင်ထိပ်ရောက်ဖို့ ကထင်ထားသလို မရှုပ်ဘူး။ အချက် ၄ ချက်ကို ဖြေရှင်းရုံပါပဲ။ မြေပုံအတိအကျနဲ့ လမ်းမှာ ကြုံရမယ့် အခက်အခဲတိုင်းအတွက် အဖြေရှိတယ်။ စတက်ဖို့ ready ပဲလား ကိုယ့်လူတို့ 💪🏻
          </p>
          <div className="btn-group">
            <a
              href="#programs"
              className="btn btn-cta"
              onClick={(e) => handleScrollTo(e, "programs")}
            >
              <i className="ph ph-fire"></i> Start Your Journey
            </a>
            <a href="/login" className="btn btn-outline">
              <i className="ph ph-sign-in"></i> Login
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="scroll-indicator">
          <i className="ph ph-caret-double-down"></i>
        </div>
      </section>

      {/* ========== SECTION 2: ONE-ON-ONE COACHING ========== */}
      <section className="section-coaching" id="coaching">
        <div className="container">
          <div className="coaching-grid">
            <div className="coaching-info revealed">
              <span className="section-badge"><i className="ph ph-user-focus"></i> Personal Training</span>
              <h2>One-on-One <span className="accent">Coaching</span></h2>
              <p className="coaching-desc">
                တစ်ယောက်ချင်းစီရဲ့ ခန္ဓာကိုယ်အခြေအနေ၊ ပန်းတိုင်၊ နေ့စဉ်အချိန်ဇယားကို ဂရုတစိုက်လေ့လာပြီး သင့်အတွက်သာ ဖန်တီးထားတဲ့ Plan တစ်ခုနဲ့ အမြင့်ဆုံးရလဒ်ကို ရယူလိုက်ပါ။
              </p>

              <div className="service-list">
                <div className="service-item">
                  <i className="ph-fill ph-check-circle"></i>
                  <span>Customized Workout Plan (လေ့ကျင့်ခန်း အစီအစဉ်)</span>
                </div>
                <div className="service-item">
                  <i className="ph-fill ph-check-circle"></i>
                  <span>Personalized Nutrition Guide (အာဟာရ လမ်းညွှန်)</span>
                </div>
                <div className="service-item">
                  <i className="ph-fill ph-check-circle"></i>
                  <span>Weekly Check-in & Progress Tracking</span>
                </div>
                <div className="service-item">
                  <i className="ph-fill ph-check-circle"></i>
                  <span>Daily Habit Building System</span>
                </div>
                <div className="service-item">
                  <i className="ph-fill ph-check-circle"></i>
                  <span>Direct Trainer Messaging & Support</span>
                </div>
                <div className="service-item">
                  <i className="ph-fill ph-check-circle"></i>
                  <span>Body Composition Analysis (ခန္ဓာကိုယ် ပိုင်းခြားစိတ်ဖြာ)</span>
                </div>
              </div>

              <a
                href="#programs"
                className="btn btn-coaching"
                onClick={(e) => handleScrollTo(e, "programs")}
              >
                <i className="ph ph-lightning"></i> Coaching ယူမယ်
              </a>
            </div>
            <div className="coaching-visual revealed">
              <div className="coaching-card-stack">
                <div className="c-card c-card-1">
                  <i className="ph ph-calendar-check"></i>
                  <h4>Weekly Plan</h4>
                  <p>အပတ်စဉ် Program</p>
                </div>
                <div className="c-card c-card-2">
                  <i className="ph ph-chart-line-up"></i>
                  <h4>Progress Track</h4>
                  <p>တိုးတက်မှု မှတ်တမ်း</p>
                </div>
                <div className="c-card c-card-3">
                  <i className="ph ph-chats-circle"></i>
                  <h4>Direct Support</h4>
                  <p>တိုက်ရိုက် အကူအညီ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== SECTION 3: PROGRAMS ========== */}
      <section className="section-programs" id="programs">
        <div className="container">
          <div className="section-header revealed">
            <span className="section-badge"><i className="ph ph-barbell"></i> Programs</span>
            <h2>Transformation <span className="accent">Programs</span></h2>
            <p className="section-subtitle">သင့်ရဲ့ ခန္ဓာကိုယ်အမျိုးအစားနဲ့ ပန်းတိုင်ပေါ်မူတည်ပြီး သင့်တော်ဆုံး Program ကို ရွေးချယ်လိုက်ပါ။</p>
          </div>

          <div className="programs-grid">
            {/* Program 1: Skinnyfat Recomp */}
            <div className="program-card revealed" onClick={() => openProgramModal("recomp")}>
              <div className="program-card-visual">
                <img src="/user/Skinnyfat.jpg" alt="Skinnyfat Recomp Transformation" className="program-cover-img" />
                <div className="program-badge-float"><i className="ph ph-calendar-check"></i> 12 Weeks</div>
                <div className="program-cover-shine"></div>
              </div>
              <div className="program-card-body">
                <div className="program-header">
                  <span className="program-tag tag-blue">Body Recomposition</span>
                  <h3>Skinnyfat Recomp</h3>
                  <p className="program-tagline">Soft → Defined</p>
                </div>
                <div className="program-includes">
                  <span><i className="ph ph-barbell"></i> Program</span>
                  <span><i className="ph ph-bowl-food"></i> Diet</span>
                  <span><i className="ph ph-list-checks"></i> Habits</span>
                  <span><i className="ph ph-users"></i> Community</span>
                </div>
                <div className="program-card-cta">
                  <span>အသေးစိတ်ကြည့်မယ်</span>
                  <i className="ph ph-arrow-right"></i>
                </div>
              </div>
            </div>

            {/* Program 2: Project-20 */}
            <div className="program-card featured revealed" onClick={() => openProgramModal("project20")}>
              <div className="featured-ribbon"><i className="ph-fill ph-fire"></i> Popular</div>
              <div className="program-card-visual">
                <img src="/user/project 20.jpg" alt="Project 20 Fat Loss Transformation" className="program-cover-img" />
                <div className="program-badge-float"><i className="ph ph-calendar-check"></i> 12 Weeks</div>
                <div className="program-cover-shine"></div>
              </div>
              <div className="program-card-body">
                <div className="program-header">
                  <span className="program-tag tag-orange">Fat Loss</span>
                  <h3>Project-20</h3>
                  <p className="program-tagline">20 lbs ချမယ် → Lean Body</p>
                </div>
                <div className="program-includes">
                  <span><i className="ph ph-barbell"></i> Program</span>
                  <span><i className="ph ph-bowl-food"></i> Diet</span>
                  <span><i className="ph ph-list-checks"></i> Habits</span>
                  <span><i className="ph ph-users"></i> Community</span>
                </div>
                <div className="program-card-cta">
                  <span>အသေးစိတ်ကြည့်မယ်</span>
                  <i className="ph ph-arrow-right"></i>
                </div>
              </div>
            </div>

            {/* Program 3: Mass Method */}
            <div className="program-card revealed" onClick={() => openProgramModal("mass")}>
              <div className="program-card-visual">
                <img src="/user/mass method.jpg" alt="Mass Method Muscle Building Transformation" className="program-cover-img" />
                <div className="program-badge-float"><i className="ph ph-calendar-check"></i> 12 Weeks</div>
                <div className="program-cover-shine"></div>
              </div>
              <div className="program-card-body">
                <div className="program-header">
                  <span className="program-tag tag-green">Muscle Building</span>
                  <h3>Mass Method</h3>
                  <p className="program-tagline">Skinny → Muscular</p>
                </div>
                <div className="program-includes">
                  <span><i className="ph ph-barbell"></i> Program</span>
                  <span><i className="ph ph-bowl-food"></i> Diet</span>
                  <span><i className="ph ph-list-checks"></i> Habits</span>
                  <span><i className="ph ph-users"></i> Community</span>
                </div>
                <div className="program-card-cta">
                  <span>အသေးစိတ်ကြည့်မယ်</span>
                  <i className="ph ph-arrow-right"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== SECTION 4: ABOUT US / TRAINER ========== */}
      <section className="section-about" id="about">
        <div className="container">
          <div className="section-header revealed">
            <span className="section-badge"><i className="ph ph-info"></i> About Us</span>
            <h2>Meet Your <span className="accent">Trainer</span></h2>
          </div>

          <div className="about-grid revealed">
            <div className="trainer-photo-wrap">
              <img src="/Ax.jpg" alt="Head Trainer Thet Naing Htun" className="trainer-photo" />
              <div className="trainer-name-tag">
                <h4>Head Coach</h4>
                <p>Project Peak 空 Founder</p>
              </div>
            </div>
            <div className="trainer-info">
              <h3>ခန္ဓာကိုယ်ပြောင်းလဲရေး Specialist</h3>
              <p className="trainer-bio">
                ကျနော်ယုံကြည်တာက — ဘယ်သူမဆို မှန်ကန်တဲ့ Plan နဲ့ Consistency ရှိရင် ခန္ဓာကိုယ်ကို လုံးဝပြောင်းလဲနိုင်ပါတယ်။ Shortcut မရှိပါဘူး။ ဒါပေမယ့် Smart Way ရှိပါတယ်။ Project Peak 空 က သင့်ရဲ့ ခရီးကို ဘယ်တော့မှ တစ်ယောက်တည်း မလျှောက်ရစေဖို့ တည်ဆောက်ထားတာပါ။
              </p>

              <div className="credentials-grid">
                <div className="credential-item">
                  <i className="ph-fill ph-certificate"></i>
                  <div>
                    <strong>Certifications</strong>
                    <p>Certified Personal Trainer (CPT), Sports Nutrition Specialist</p>
                  </div>
                </div>
                <div className="credential-item">
                  <i className="ph-fill ph-clock-countdown"></i>
                  <div>
                    <strong>Experience</strong>
                    <p>5+ Years in Body Transformation & Coaching</p>
                  </div>
                </div>
                <div className="credential-item">
                  <i className="ph-fill ph-heart"></i>
                  <div>
                    <strong>Philosophy</strong>
                    <p>Sustainable results through discipline, science-based training & proper nutrition</p>
                  </div>
                </div>
                <div className="credential-item">
                  <i className="ph-fill ph-star"></i>
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

      {/* ========== SECTION 5: COMMUNITY (BOTTOM) ========== */}
      <section className="section-community" id="community">
        <div className="container">
          <div className="section-header revealed">
            <span className="section-badge"><i className="ph ph-users-three"></i> Our Community</span>
            <h2>Project Peak <span className="accent">空</span> Community</h2>
            <p className="section-subtitle">တစ်ယောက်တည်းမတက်ပါနဲ့။ ညီအစ်ကိုတွေနဲ့အတူတက်ပါ။ Project Peak Community မှာ တစ်ယောက်ရဲ့ အောင်မြင်မှုက တစ်ယောက်ရဲ့ Motivation ဖြစ်ပါတယ်။</p>
          </div>
          <div className="mountain-image-wrapper revealed">
            <img src="/mountain.jpg" alt="Project Peak Mountain Journey" className="mountain-img" />
            <div className="mountain-caption"><span>Diet → Training → Habits → Recovery → <strong>THE PEAK 空</strong></span></div>
          </div>
          <div className="community-stats revealed">
            <div className="stat-item">
              <i className="ph ph-users"></i>
              <span className="stat-number">{statMembers}</span>+
              <span className="stat-label">Active Members</span>
            </div>
            <div className="stat-item">
              <i className="ph ph-trophy"></i>
              <span className="stat-number">{statSuccessRate}</span>%
              <span className="stat-label">Success Rate</span>
            </div>
            <div className="stat-item">
              <i className="ph ph-star"></i>
              <span className="stat-number">{statPrograms}</span>
              <span className="stat-label">Week Programs</span>
            </div>
          </div>
          <div className="text-center revealed">
            <a
              href="#programs"
              className="btn btn-community"
              onClick={(e) => handleScrollTo(e, "programs")}
            >
              <i className="ph ph-hand-fist"></i> Join Our Community
            </a>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <Image src="/img/logo.svg" alt="Project Peak Logo" width={35} height={35} />
              <span>Project Peak <span className="kanji">空</span></span>
            </div>
            <p>မဖြစ်နိုင်တာမရှိတဲ့ ပန်းတိုင်ဆီသို့။</p>
            <div className="footer-links">
              <a href="#hero" onClick={(e) => handleScrollTo(e, "hero")}>Home</a>
              <a href="#programs" onClick={(e) => handleScrollTo(e, "programs")}>Programs</a>
              <a href="#coaching" onClick={(e) => handleScrollTo(e, "coaching")}>PT</a>
              <a href="#about" onClick={(e) => handleScrollTo(e, "about")}>About</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 Project Peak 空. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ========== PROGRAM DETAIL MODAL ========== */}
      {modalOpen && (
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) closeProgramModal(); }}>
          <div className="modal-content">
            <button className="modal-close" onClick={closeProgramModal} aria-label="Close modal">
              <i className="ph ph-x"></i>
            </button>

            {/* STEP 1: Overview */}
            {modalStep === 1 && (
              <div className="modal-step active">
                <div className="modal-visual">
                  <div className="modal-cover-wrap">
                    <img src={currentProgram.imgSrc} alt={currentProgram.title} />
                    <div className="modal-cover-tag" style={{ background: currentProgram.color }}>
                      {currentProgram.tag}
                    </div>
                  </div>
                </div>
                <h2>{currentProgram.title}</h2>
                <p className="modal-desc">{currentProgram.desc}</p>
                <div className="modal-what-you-get">
                  <h4>ရရှိမည့်အရာများ</h4>
                  <div className="get-grid">
                    {currentProgram.includes.map((inc, i) => (
                      <div className="get-item" key={i}>
                        <i className={`ph ${inc.icon}`}></i>
                        <strong>{inc.title}</strong>
                        <span>{inc.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="modal-price">
                  <i className="ph ph-tag"></i> စျေးနှုန်း: <strong>{currentProgram.price}</strong>
                </div>
                <button className="btn btn-cta btn-block" onClick={() => setModalStep(2)}>
                  <i className="ph ph-arrow-right"></i> ဆက်သွားမည် (Workout Split ရွေးမယ်)
                </button>
              </div>
            )}

            {/* STEP 2: Workout Split Choice */}
            {modalStep === 2 && (
              <div className="modal-step active">
                <h2><i className="ph ph-barbell"></i> Workout Split</h2>
                <p className="modal-desc">သင့် နေထိုင်မှုပုံစံနှင့် အကိုက်ညီဆုံး Workout Split ကို ရွေးချယ်ပါ။</p>
                <div className="split-cards-container">
                  <div
                    className={`split-card ${selectedSplit === "fullbody" ? "selected" : ""}`}
                    onClick={() => setSelectedSplit("fullbody")}
                  >
                    <div className="split-card-header">
                      <div className="split-title-row">
                        <i className="ph ph-lightning"></i>
                        <strong>Fullbody Split</strong>
                      </div>
                      <div className="split-radio"><i className="ph ph-check"></i></div>
                    </div>
                    <div className="split-meta">
                      <span><i className="ph ph-clock"></i> 1:30 hr</span>
                      <span><i className="ph ph-calendar"></i> တစ်ပတ် ၃ ရက်</span>
                    </div>
                    <p className="split-desc">ရက်နည်းနည်းနဲ့ တခါထဲအချိန်ပိုပေးနိုင်သူတွေအတွက်</p>
                  </div>

                  <div
                    className={`split-card ${selectedSplit === "ppl" ? "selected" : ""}`}
                    onClick={() => setSelectedSplit("ppl")}
                  >
                    <div className="split-card-header">
                      <div className="split-title-row">
                        <i className="ph ph-fire"></i>
                        <strong>Push / Pull / Legs</strong>
                      </div>
                      <div className="split-radio"><i className="ph ph-check"></i></div>
                    </div>
                    <div className="split-meta">
                      <span><i className="ph ph-clock"></i> 40 min</span>
                      <span><i className="ph ph-calendar"></i> တစ်ပတ် ၆ ရက်</span>
                    </div>
                    <p className="split-desc">တစ်ရက်ကိုအချိန်နည်းနည်းဘဲပေးနိုင်ပေမဲ့ နေ့တိုင်းသွားနိုင်တဲ့သူတွေအတွက် (Gymနဲ့နီးရင်အဆင်ပြေတယ်)</p>
                  </div>

                  <div
                    className={`split-card ${selectedSplit === "upperlower" ? "selected" : ""}`}
                    onClick={() => setSelectedSplit("upperlower")}
                  >
                    <div className="split-card-header">
                      <div className="split-title-row">
                        <i className="ph ph-scales"></i>
                        <strong>Upper / Lower</strong>
                      </div>
                      <div className="split-radio"><i className="ph ph-check"></i></div>
                    </div>
                    <div className="split-meta">
                      <span><i className="ph ph-clock"></i> 1 hr</span>
                      <span><i className="ph ph-calendar"></i> တစ်ပတ် ၄ ရက်</span>
                    </div>
                    <p className="split-desc">အများစုနဲ့ အချိန်ကော/recoveryကောအသင့်တော်ဆုံးsplit</p>
                  </div>
                </div>
                <button
                  className="btn btn-cta btn-block"
                  onClick={() => {
                    if (!selectedSplit) {
                      alert("ကျေးဇူးပြု၍ မိမိနှင့် အကိုက်ညီဆုံး Workout Split တစ်ခုကို ရွေးချယ်ပေးပါ။");
                      return;
                    }
                    setModalStep(3);
                  }}
                >
                  <i className="ph ph-credit-card"></i> ငွေပေးချေမယ့်အဆင့်သို့
                </button>
                <button className="btn btn-outline btn-block" onClick={() => setModalStep(1)}>
                  <i className="ph ph-arrow-left"></i> နောက်သို့
                </button>
              </div>
            )}

            {/* STEP 3: Payment */}
            {modalStep === 3 && (
              <div className="modal-step active">
                <h2><i className="ph ph-credit-card"></i> Payment</h2>
                <p className="modal-desc">KBZ Pay QR သို့ ငွေလွှဲပြီး Screenshot ပို့ပေးပါ။</p>
                <div className="qr-payment-box">
                  <div className="qr-img-wrap">
                    <img src="/user/kpay TNH.jpg" alt="KPay QR Code" className="qr-img" />
                  </div>
                  <div className="qr-info">
                    <div className="pay-phone-box">
                      <div className="pay-phone-label"><i className="ph ph-phone"></i> KPay Phone Number</div>
                      <div className="pay-phone-row">
                        <span id="kpayPhone">09779214809</span>
                        <button className="btn-copy" onClick={copyPhone} id="copyBtn">
                          <i className="ph ph-copy"></i> {copyStatus}
                        </button>
                      </div>
                    </div>
                    <div className="pay-name-box">
                      <i className="ph ph-user-circle"></i>
                      <div>
                        <span className="pay-name-label">Account Name</span>
                        <strong className="pay-name-val">Thet Naing Htun</strong>
                      </div>
                    </div>
                  </div>
                </div>
                <button className="btn btn-cta btn-block" onClick={() => setModalStep(4)}>
                  <i className="ph ph-check"></i> ငွေလွှဲပြီးပါပြီ
                </button>
                <button className="btn btn-outline btn-block" onClick={() => setModalStep(2)}>
                  <i className="ph ph-arrow-left"></i> နောက်သို့
                </button>
              </div>
            )}

            {/* STEP 4: Registration Form */}
            {modalStep === 4 && (
              <div className="modal-step active">
                <h2><i className="ph ph-clipboard-text"></i> Registration Form</h2>
                <p className="modal-desc">သင့်အချက်အလက်များကို ပြည့်စုံစွာ ဖြည့်ပေးပါ။</p>
                <form className="modal-form" onSubmit={handleFormSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>အမည် (Name)</label>
                      <input
                        type="text"
                        placeholder="သင့်နာမည်"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>အသက် (Age)</label>
                      <input
                        type="number"
                        placeholder="25"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>အရပ် (Height)</label>
                      <input
                        type="text"
                        placeholder={"5'8\" or 170cm"}
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>ကိုယ်အလေးချိန် (Weight - lbs)</label>
                      <input
                        type="number"
                        placeholder="160"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>အီးမေးလ် (Email)</label>
                      <input
                        type="email"
                        placeholder="yourname@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>ဖုန်းနံပါတ် (Phone Number)</label>
                      <input
                        type="tel"
                        placeholder="09-xxx-xxx-xxx"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-section-title"><i className="ph ph-camera"></i> ခန္ဓာကိုယ် ဓာတ်ပုံများ (Body Photos)</div>
                  <div className="form-photos-grid">
                    <div className="photo-upload-box">
                      <label>ရှေ့ပိုင်း (Front)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPhotoFront(e.target.files?.[0] || null)}
                        required
                      />
                    </div>
                    <div className="photo-upload-box">
                      <label>နောက်ပိုင်း (Back)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPhotoBack(e.target.files?.[0] || null)}
                        required
                      />
                    </div>
                    <div className="photo-upload-box">
                      <label>ဘေးပိုင်း (Side)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPhotoSide(e.target.files?.[0] || null)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group mt-3">
                    <label>ယခု စတင်ဖြစ်သော အကြောင်းရင်း (Reason for starting now)</label>
                    <textarea
                      rows={3}
                      placeholder="သင့်ရဲ့ အဓိက ရည်မှန်းချက်နဲ့ ယခုပရိုဂရမ်ကို စတင်ချင်တဲ့ အကြောင်းရင်းကို မျှဝေပေးပါ..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      required
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label>ငွေလွှဲပြေစာ (Payment Screenshot)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-cta btn-block" disabled={submitting}>
                    {submitting ? (
                      <>
                        <i className="ph ph-spinner ph-spin"></i> ပေးပို့နေပါသည်... (Submitting)
                      </>
                    ) : (
                      <>
                        <i className="ph ph-paper-plane-tilt"></i> အတည်ပြု၍ ပေးပို့မည် (Submit)
                      </>
                    )}
                  </button>
                </form>
                <button className="btn btn-outline btn-block" onClick={() => setModalStep(3)}>
                  <i className="ph ph-arrow-left"></i> နောက်သို့
                </button>
              </div>
            )}

            {/* STEP 5: Success Page */}
            {modalStep === 5 && (
              <div className="modal-step active">
                <div className="success-animation"><i className="ph ph-check-circle"></i></div>
                <h2>ဖောင်ပေးပို့မှု အောင်မြင်ပါသည်!</h2>
                <p className="modal-desc">
                  သင့်အချက်အလက်များကို Admin Account တွင် သိမ်းဆည်းပြီးဖြစ်ပါသည်။<br />
                  လုပ်ငန်းစဉ် အမြန်ဆုံး ပြီးမြောက်စေရန် အောက်ပါ <strong>Telegram Link</strong> သို့ နှိပ်၍ Head Coach (@axx21212) ထံသို့ ငွေလွှဲပြေစာနှင့် ဓာတ်ပုံများကို တိုက်ရိုက် ပေးပို့ပေးပါခင်ဗျာ။
                </p>

                <div className="telegram-box mt-3 mb-3" style={{ background: "#f0fdf4", border: "2px solid #22c55e", padding: "1.5rem", borderRadius: "16px", textAlign: "center" }}>
                  <i className="ph ph-telegram-logo" style={{ fontSize: "3.5rem", color: "#22c55e", marginBottom: "0.5rem", display: "inline-block" }}></i>
                  <h3 style={{ color: "#166534", marginBottom: "0.5rem" }}>Telegram သို့ ဆက်သွယ်ရန်</h3>
                  <p style={{ color: "#15803d", fontSize: "0.95rem", marginBottom: "1.2rem" }}>Head Coach (@axx21212) ၏ တရားဝင် Telegram Account သို့ တိုက်ရိုက် ရောက်ရှိမည်ဖြစ်ပါသည်။</p>
                  <a href="https://t.me/axx21212" target="_blank" rel="noopener noreferrer" className="btn btn-cta" style={{ background: "#22c55e", color: "#fff", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.8rem 2rem", fontSize: "1.1rem", borderRadius: "50px", boxShadow: "0 10px 25px rgba(34,197,94,0.3)" }}>
                    <i className="ph ph-paper-plane-right"></i> @axx21212 သို့ ပေးပို့မည် (Open Telegram)
                  </a>
                </div>

                <div className="success-includes">
                  <span><i className="ph ph-barbell"></i> Program</span>
                  <span><i className="ph ph-bowl-food"></i> Diet Plan</span>
                  <span><i className="ph ph-list-checks"></i> Habit Tracker</span>
                  <span><i className="ph ph-users"></i> Community Access</span>
                </div>
                <button className="btn btn-outline btn-block" onClick={closeProgramModal}>
                  <i className="ph ph-house"></i> ပင်မစာမျက်နှာသို့ ပြန်သွားမည်
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
