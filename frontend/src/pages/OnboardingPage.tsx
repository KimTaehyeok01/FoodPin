import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './OnboardingPage.css';

const slides = [
  {
    emoji: '📍',
    title: '내 맛집을 지도에',
    desc: '가본 식당을 지도에 핀으로 찍고\n나만의 맛집 지도를 만들어보세요.',
  },
  {
    emoji: '⭐',
    title: '별점과 메모 기록',
    desc: '식당마다 별점과 메모를 남겨\n소중한 맛집 경험을 기억하세요.',
  },
  {
    emoji: '🗺️',
    title: '언제 어디서나',
    desc: '모바일에서 간편하게\n내 맛집 지도를 확인하세요.',
  },
];

export default function OnboardingPage() {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const next = () => {
    if (current < slides.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      localStorage.setItem('onboarding_seen', '1');
      navigate('/login');
    }
  };

  const skip = () => {
    localStorage.setItem('onboarding_seen', '1');
    navigate('/login');
  };

  const slide = slides[current];

  return (
    <div className="onboarding">
      <button className="onboarding__skip" onClick={skip}>
        건너뛰기
      </button>

      <div className="onboarding__content">
        <div className="onboarding__emoji">{slide.emoji}</div>
        <h2 className="onboarding__title">{slide.title}</h2>
        <p className="onboarding__desc">{slide.desc}</p>
      </div>

      <div className="onboarding__bottom">
        <div className="onboarding__dots">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`dot ${i === current ? 'dot--active' : ''}`}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>

        <button className="onboarding__btn" onClick={next}>
          {current < slides.length - 1 ? '다음' : '시작하기'}
        </button>
      </div>
    </div>
  );
}
