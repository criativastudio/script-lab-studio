
-- Data fix: backfill strategic contexts for orphaned briefings
INSERT INTO public.client_strategic_contexts (user_id, business_name, business_niche, products_services, target_audience, marketing_objectives, communication_style, is_completed)
SELECT '4e52decb-5c7f-4591-a415-d7b42b0dcda3'::uuid, 'Criativa Studio', 'Produtora Audiovisual',
  'Produtora audiovisual: gravação de podcasts, videoclipes (externos e acústicos no estúdio), conteúdos para empresas em cenário moderno com cortes editados profissionais. Vídeos estratégicos para médicos, dentistas, advogados e clínicas de estética. Plataforma própria de criação de roteiros. Gravação de cursos online.',
  'Profissionais liberais com agenda lotada; músicos independentes e bandas locais; donos de clínicas de estética; infoprodutores; escritórios de advocacia; médicos buscando autoridade digital; empresas de tecnologia para podcasts; especialistas criando cursos digitais; empresários e empreendedores que querem se posicionar no digital.',
  'Autoridade máxima no nicho profissional, Atrair investidores e patrocinadores musicais, Posicionamento premium para clínicas locais',
  'Profissionalismo técnico com toque criativo, Autoridade premium e sofisticada, Parceiro estratégico e facilitador digital, Inspirador para talentos artísticos, Especialista em posicionamento de alto valor, Direto focado em conversão e resultados',
  false
WHERE NOT EXISTS (SELECT 1 FROM public.client_strategic_contexts WHERE user_id = '4e52decb-5c7f-4591-a415-d7b42b0dcda3'::uuid AND business_name = 'Criativa Studio');

INSERT INTO public.client_strategic_contexts (user_id, business_name, business_niche, products_services, target_audience, marketing_objectives, communication_style, is_completed)
SELECT '81a68b3a-64f3-443b-99af-7fea5fabe7f7'::uuid, 'R-CAR', 'Concessionária de veículos',
  'Concessionária de venda de carros novos e seminovos. Resolve: sonho do carro novo, compra do primeiro carro, troca de carro.',
  'Homens e mulheres acima de 18 anos que querem comprar um carro ou moto.',
  'Atrair novos clientes, Construir autoridade, Fortalecer posicionamento da marca, Aumentar vendas',
  'Estilo reels do Instagram, Vídeos de autoridade/especialista, Depoimentos',
  false
WHERE NOT EXISTS (SELECT 1 FROM public.client_strategic_contexts WHERE user_id = '81a68b3a-64f3-443b-99af-7fea5fabe7f7'::uuid AND business_name = 'R-CAR');

INSERT INTO public.client_strategic_contexts (user_id, business_name, business_niche, products_services, target_audience, marketing_objectives, communication_style, is_completed)
SELECT '363a5065-df7b-4e4a-bbf4-545ccc87a143'::uuid, 'Odonto Prime', 'Clínica odontológica',
  'Clínica odontológica em Jaru. Resolve: dor ou desconforto, baixa autoconfiança.',
  'Homens, mulheres e pessoas buscando melhoria estética e resolução de problemas bucais.',
  'Atrair novos clientes, Aumentar vendas, Construir autoridade, Apresentar a empresa, Fortalecer posicionamento da marca',
  'Estilo reels do Instagram, Vídeos de autoridade/especialista, Antes e depois',
  false
WHERE NOT EXISTS (SELECT 1 FROM public.client_strategic_contexts WHERE user_id = '363a5065-df7b-4e4a-bbf4-545ccc87a143'::uuid AND business_name = 'Odonto Prime');
