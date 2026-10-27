// Vercel 서버리스 함수: 환경변수 PIXABAY_API_KEY 로 Pixabay 를 대신 호출한다.
// 키가 브라우저에 노출되지 않는다.
module.exports = async (req, res) => {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'PIXABAY_API_KEY 환경변수가 설정되지 않았습니다.' });
  }

  const q = String(req.query.q || '').trim().slice(0, 100);
  const page = Math.min(50, Math.max(1, parseInt(req.query.page, 10) || 1));
  if (!q) return res.status(400).json({ error: '검색어를 입력하세요.' });

  const url = 'https://pixabay.com/api/?' + new URLSearchParams({
    key, q, image_type: 'photo', per_page: '10', page: String(page),
  });

  try {
    const r = await fetch(url);
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = null; }
    if (!r.ok || !data) {
      const msg = r.status === 429 ? '요청 한도를 초과했습니다. 잠시 후 다시 시도하세요.'
                : r.status === 400 ? 'API 키 또는 요청이 올바르지 않습니다.'
                : `Pixabay 오류 (${r.status})`;
      return res.status(r.status || 502).json({ error: msg });
    }
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ totalHits: data.totalHits, hits: data.hits });
  } catch (e) {
    return res.status(502).json({ error: 'Pixabay 서버에 연결하지 못했습니다.' });
  }
};
