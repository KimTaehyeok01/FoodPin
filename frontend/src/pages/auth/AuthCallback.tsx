import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../../api/restaurants';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get('token');

    if (!token) {
      navigate('/', { replace: true });
      return;
    }
    localStorage.setItem('token', token);

    // 소셜 로그인은 이름·주소·나이·성별을 제공하지 않으므로, 비어있으면 추가 입력 페이지로 보낸다
    usersApi.getMe()
      .then((me) => {
        const incomplete = !me.name || !me.address || me.age == null || !me.gender;
        navigate(incomplete ? '/complete-profile' : '/', { replace: true });
      })
      .catch(() => navigate('/', { replace: true }));
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      로그인 중...
    </div>
  );
}
