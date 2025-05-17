import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from "react-router-dom";
import mainStyles from './css_folder/Main.module.css';

export default function HomePage() {
  const headerRef = useRef(null);
  const navigate = useNavigate();

  const textListRef = useRef([
    'Web Publisher',
    'Front-End Developer',
    'Web UI Designer',
    'UX Designer',
    'Back-End Developer'
  ]);

  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let timer;
    const fullText = textListRef.current[index];

    if (isDeleting) {
      timer = setTimeout(() => {
        setCurrentText(prev => prev.slice(0, -1));
      }, Math.random() * 100);
    } else {
      timer = setTimeout(() => {
        setCurrentText(prev => fullText.slice(0, prev.length + 1));
      }, Math.random() * 100);
    }

    if (!isDeleting && currentText === fullText) {
      setTimeout(() => setIsDeleting(true), 3000);
    }

    if (isDeleting && currentText === '') {
      setIsDeleting(false);
      setIndex((prev) => (prev + 1) % textListRef.current.length);
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, index]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      if (headerRef.current) {
        headerRef.current.classList.toggle(mainStyles.active, scrollY > 0);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleScrollClick = (e) => {
      const targetSelector = e.currentTarget.dataset.target;
      const targetEl = document.querySelector(targetSelector);
      if (targetEl) {
        const scrollY = window.pageYOffset;
        const targetY = targetEl.getBoundingClientRect().top + scrollY;
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      }
    };

    const scrollButtons = document.querySelectorAll("[data-animation-scroll='true']");
    scrollButtons.forEach((btn) => btn.addEventListener("click", handleScrollClick));

    return () => {
      scrollButtons.forEach((btn) => btn.removeEventListener("click", handleScrollClick));
    };
  }, []);

  return (
    <>
      <header ref={headerRef} className={mainStyles.header}>
        <div className={mainStyles.headerContainer}>
          <h1>
            <button onClick={() => navigate("/")} className={mainStyles.titleButton}>wiffle</button>
          </h1>
          <nav>
            <ul className={mainStyles.navList}>
              <li className={mainStyles.navItem}>
                <button className={mainStyles.menu} data-animation-scroll="true" data-target="#about">About</button>
              </li>
              <li className={mainStyles.block}>|</li>
              <li className={mainStyles.navItem}>
                <button className={mainStyles.menu} data-animation-scroll="true" data-target="#features">Features</button>
              </li>
              <li className={mainStyles.block}>|</li>
              <li className={mainStyles.navItem}>
                <button className={mainStyles.menu} data-animation-scroll="true" data-target="#portfolio">Resource</button>
              </li>
              <li className={mainStyles.block}>|</li>
              <li className={mainStyles.navItem}>
                <Link to="/login" className={mainStyles.linkReset}>
                  <button className={mainStyles.menu} data-animation-scroll="true" data-target="#contact">Login</button>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main id="main" className={mainStyles.main}>
        <div className={`${mainStyles.container} ${mainStyles.mainContainer}`}>
          <h1>We can manage these things all at once.</h1>
          <h2 className={mainStyles.activeText}><span>{currentText}</span></h2>
          <p>Are you still not going to try this?</p>
          <button className={mainStyles.mouse}><i className="fa-solid fa-computer-mouse"></i></button>
        </div>
      </main>

      {/* 빈 섹션에도 최소 내용 넣어줌 */}
      <section id="about" className={mainStyles.main}>
        <div className={mainStyles.container}>
          <h2>About</h2>
          <p>Learn more about Wiffle.</p>
        </div>
      </section>

      <footer id="footer" className={mainStyles.footer}>
        <div className={mainStyles.footerContainer}>
          <span className={mainStyles.logo_text}>
            <button data-animation-scroll="true" data-target="#main">
              <i className='bx bxl-slack'></i><h1>wiffle</h1>
            </button>
          </span>
          <ul className={mainStyles.footerMenu}>
            <div>
              <li><h3>ABOUT<hr /></h3></li>
              <li><Link to="#" className={mainStyles.linkReset}>manual</Link></li>
            </div>
            <div>
              <li><h3>FEATURES<hr /></h3></li>
              <li><Link to="#" className={mainStyles.linkReset}>manual</Link></li>
            </div>
            <div>
              <li><h3>RESOURCE<hr /></h3></li>
              <li><Link to="#" className={mainStyles.linkReset}>What’s New</Link></li>
            </div>
            <div>
              <li><h3>PRODUCER<hr /></h3></li>
              <li><Link to="#" className={mainStyles.linkReset}>manual</Link></li>
            </div>
            <div>
              <li>
                <Link to="/login" className={mainStyles.linkReset}>
                  <button data-animation-scroll="true" data-target="#contact">
                    <h2>GET STARTED</h2>
                  </button>
                </Link>
              </li>
            </div>
          </ul>
          <span className={mainStyles.copyright_text}>
            Copyright © 2025 <button data-animation-scroll="true" data-target="#main">wiffle</button>
          </span>
        </div>
      </footer>
    </>
  );
}