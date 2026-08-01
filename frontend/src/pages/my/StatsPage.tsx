// 내 방문 통계 대시보드 — 카테고리·별점·월별 방문 추이를 차트로 표시
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from 'recharts';
import { pinsApi } from '../../api/restaurants';
import type { Pin } from '../../api/restaurants';
import {
  getCategoryCounts,
  getRatingDistribution,
  getMonthlyVisits,
  getAverageRating,
} from '../../utils/stats';
import './StatsPage.css';

const AXIS_TICK = { fill: '#898781', fontSize: 12 };
const LABEL_STYLE = { fill: '#555', fontSize: 12, fontWeight: 700 };
const GRID_COLOR = '#e1e0d9';
const BRAND_COLOR = '#ff6b35';

export default function StatsPage() {
  const navigate = useNavigate();
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleBack = () => setIsLeaving(true);

  useEffect(() => {
    pinsApi.getMyPins()
      .then(setPins)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categoryCounts = getCategoryCounts(pins).slice(0, 6);
  const ratingDistribution = getRatingDistribution(pins);
  const monthlyVisits = getMonthlyVisits(pins);
  const averageRating = getAverageRating(pins);

  const now = new Date();
  const thisMonthCount = pins.filter((p) => {
    const created = new Date(p.createdAt);
    return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
  }).length;

  return (
    <div
      className={`stats-page${isLeaving ? ' stats-page--leaving' : ''}`}
      onAnimationEnd={(e) => { if (isLeaving && e.target === e.currentTarget) navigate(-1); }}
    >
      <header className="stats-header">
        <button className="stats-back" onClick={handleBack} aria-label="뒤로가기">
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>
        <h1 className="stats-title">내 방문 통계</h1>
      </header>

      <div className="stats-body">
        {loading ? (
          <>
            <div className="stats-skeleton stats-skeleton--kpi" />
            <div className="stats-skeleton" />
            <div className="stats-skeleton" />
            <div className="stats-skeleton" />
          </>
        ) : (
          <>
            <div className="stats-kpi">
              <div className="stats-kpi__item">
                <span className="stats-kpi__num">{pins.length}</span>
                <span className="stats-kpi__label">총 방문</span>
              </div>
              <div className="stats-kpi__item">
                <span className="stats-kpi__num">{averageRating}</span>
                <span className="stats-kpi__label">평균 별점</span>
              </div>
              <div className="stats-kpi__item">
                <span className="stats-kpi__num">{thisMonthCount}</span>
                <span className="stats-kpi__label">이번달 방문</span>
              </div>
            </div>

            {pins.length === 0 ? (
              <div className="stats-empty">
                <p>🍽️</p>
                <p>아직 방문 기록이 없어요</p>
                <p className="stats-empty__sub">맛집을 핀하고 통계를 확인해보세요</p>
              </div>
            ) : (
              <>
                <div className="stats-card">
                  <h2 className="stats-card__title">카테고리별 방문 순위</h2>
                  <div
                    className="stats-chart-wrap"
                    style={{ height: Math.max(160, categoryCounts.length * 44) }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={categoryCounts}
                        layout="vertical"
                        margin={{ top: 4, right: 28, left: 4, bottom: 4 }}
                      >
                        <CartesianGrid horizontal={false} stroke={GRID_COLOR} />
                        <XAxis
                          type="number"
                          allowDecimals={false}
                          tick={AXIS_TICK}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="category"
                          width={64}
                          tick={AXIS_TICK}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip formatter={(value) => [`${value}곳`, '방문']} />
                        <Bar dataKey="count" fill={BRAND_COLOR} barSize={20} radius={[0, 4, 4, 0]}>
                          <LabelList dataKey="count" position="right" style={LABEL_STYLE} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="stats-card">
                  <h2 className="stats-card__title">별점 분포</h2>
                  <div className="stats-chart-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ratingDistribution} margin={{ top: 20, right: 8, left: 0, bottom: 4 }}>
                        <CartesianGrid vertical={false} stroke={GRID_COLOR} />
                        <XAxis
                          dataKey="rating"
                          tickFormatter={(v: number) => `${v}★`}
                          tick={AXIS_TICK}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          width={28}
                          tick={AXIS_TICK}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          formatter={(value) => [`${value}개`, '리뷰']}
                          labelFormatter={(label) => `★${label}`}
                        />
                        <Bar dataKey="count" fill={BRAND_COLOR} barSize={24} radius={[4, 4, 0, 0]}>
                          <LabelList dataKey="count" position="top" style={LABEL_STYLE} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="stats-card">
                  <h2 className="stats-card__title">월별 방문 추이</h2>
                  <div className="stats-chart-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyVisits} margin={{ top: 20, right: 12, left: 0, bottom: 4 }}>
                        <CartesianGrid vertical={false} stroke={GRID_COLOR} />
                        <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} width={28} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(value) => [`${value}곳`, '방문']} />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke={BRAND_COLOR}
                          strokeWidth={2}
                          fill={BRAND_COLOR}
                          fillOpacity={0.1}
                          dot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: BRAND_COLOR }}
                          activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
