// Vercel 서버리스 함수: Pixabay API 키를 서버(환경변수)에서만 사용합니다.
// 환경변수 이름: PIXABAY_API_KEY
module.exports = async (req, res) => {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) {
    res.status(500).json({ error: '서버에 PIXABAY_API_KEY 환경변수가 설정되지 않았습니다.' });
    return;
  }

  const q = String(req.query.q || '').trim().slice(0, 100);
  const page = Math.min(Math.max(parseInt(req.query.page, 10) || 1, 1), 50);
  if (!q) {
    res.status(400).json({ error: '검색어를 입력해 주세요.' });
    return;
  }

  const url = 'https://pixabay.com/api/?' + new URLSearchParams({
    key, q, page, per_page: 10, image_type: 'photo', safesearch: 'true'
  });

  try {
    const r = await fetch(url);
    if (!r.ok) {
      res.status(r.status === 429 ? 429 : 502).json({ error: 'Pixabay 요청 실패 (' + r.status + ')' });
      return;
    }
    const data = await r.json();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json({
      totalHits: data.totalHits,
      hits: data.hits.map(h => ({ id: h.id, tags: h.tags, pageURL: h.pageURL, img: h.webformatURL }))
    });
  } catch (e) {
    res.status(502).json({ error: 'Pixabay에 연결하지 못했습니다.' });
  }
};
