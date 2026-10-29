/* ===== 作品集 AI 引擎（混合模式：真实 API + 离线兜底） ===== */

window.SmartReconAI = {

  // API Key：默认空，使用隐私保护模式；用户可在设置中输入自己的 DeepSeek Key 体验真实 AI

  apiKey: '',

  model: 'deepseek-v4-flash',

  apiUrl: 'https://api.deepseek.com/chat/completions',

  timeoutMs: 40000,



  // 离线关键词兜底库（API 不可用时使用，保证演示不卡住）— 按场景分离

  offlineReplies: {

    // 作品集助手场景（portfolio-assistant）

    portfolio: [

      { kw: ['司库', '还本付息', '贷款排程', '利息计提', 'Actual/360', 'treasury', 'amortization', '合同解析'], reply: 'AI 集团贷款还本付息动态排程与利息计提系统：银行级 Actual/360 逐日计提 + 9 笔集团流贷台账（4.15 亿）+ 4 大 KPI + 12 个月还本付息排程 + 单月超 5,000 万流动性预警；AI 合同一键解析（0.5 秒自动回填银行/本金/起止日/LPR 加点/结息方式）+ AI 司库 Copilot 流式洞察报告 + ExcelJS 复刻 11-sheet 动态穿透模板导出。单文件纯前端，打开即用。<div class="tool-call">portfolio_kb → works[1] ✓</div>' },

      { kw: ['功能','结构','有哪些','哪些作品','作品集','几个作品','作品矩阵','导览','介绍'], reply: '这个作品集围绕两件旗舰作品展开：①主页（个人介绍 + 精算/财务/AI 能力全景）②LPR 走势预测与融资成本压力测试系统（研究：四指标框架 + 蒙特卡洛概率预测 + 深度详情页）③AI 集团贷款还本付息动态排程与利息计提系统（产品：Actual/360 精算 + AI 合同解析 + 司库 Copilot，在线应用）④AI 协作经验（双 Agent 机制）<div class="tool-call">portfolio_kb → home ✓</div>' },

      { kw: ['缺陷','问题','修复','bug','历史'], reply: '已修复的缺陷（列举）：①聊天输入XSS ②ECharts全量1004KB→按需打包691KB ③证据链元素用br无法显示→改div ④证据链浅底浅字看不清→改深色文字 ⑤Agent只回固定话术→接入真实DeepSeek API ⑥API失败直接降级→加重试 ⑦数据底座缺月度资金流→补12个月数据 ⑧离线关键词跨场景劫持→场景分离 ⑨人设漂移/逻辑缺陷→persona增强+资金全景 ⑩异常中心按钮无状态流转→完整全流程。<div class="tool-call">portfolio_kb → defect_log ✓</div>' },

      { kw: ['迭代','版本','更新','演进'], reply: '作品集演进历史：v1 基础版→v2.1 ECharts按需打包→v2.2 安全修复→v2.3 接入真实DeepSeek AI→v2.4 数据底座升级→v2.5 AI拷问测试修复→v2.6 异常处理全流程→v2.7 内置作品集助手→v3.2 整合SOX工作台→v3.3 协作实战展示→v3.4 作品矩阵分级→v5.0 双Agent复核机制→v5.3 手机端适配+preflight体检→v5.5.0 业务化大改造+全站措辞业务化→v5.6.0 主页Demo入口显眼化→v5.6.1 AI协作经验章节更新（三阶段闭环+规矩6条+数据更新）→v5.7.0 作品01替换为发票合规预审（可运行Demo）→v5.7.1 作品01加系统流水线图+规则覆盖图→v6.1 精简聚焦→v6.2 细节打磨+公司名口径→v7.0 单作品重构（只留 LPR）→v7.4 新增 AI 司库→v7.6 司库上移+详情页+11-sheet 导出→v7.9 Agent 协作机制（四层分工）→v7.11 外部交叉评审修正→v7.12 契约 v1.2+第五角色→v7.13 设计打磨（标签/图表/Hero）→v7.13.2 统计回填+触发条件表→v7.13.3 统计严格口径→v7.13.4 KB 版本历史补齐→v7.14 导出样式逐像素对齐。<div class="tool-call">portfolio_kb → versions ✓</div>' },

      { kw: ['双Agent','复核机制','协作体系','怎么运作','如何运作','multi-agent','多智能体','团队','复核机制','DeepSeek','主力AI','复核AI','Gemini','四角色'], reply: '我没有把多个 AI 说成一个团队，而是把金融机构的「经办—复核—审批（Maker-Checker）」机制搬到数据建模里：① 经办：按 Actual/360 等计息规则，由 AI 生成还本付息与利息计提代码；② 复核：换另一个模型独立验算现金流与折现结果，交叉比对边界与异常；③ 裁决：本人核验财务勾稽关系与数据口径后放行。这套逻辑和「前后台制衡、四眼原则」一致——经办与复核分离，不盲信单一模型的首次输出。<div class="tool-call">portfolio_kb → quality_control ✓</div>' },

      { kw: ['复核凭证','CI闸门','闸门','复核记录'], reply: '质量控制的做法是「经办—复核—裁决」三段：AI 按业务规则生成计算代码（经办）；换另一个模型独立验算现金流与折现结果，交叉比对边界异常（复核）；本人核验财务勾稽关系与数据口径后放行（裁决）。每次发现的问题都会记成规则，避免同类错误重复出现。<div class="tool-call">portfolio_kb → quality_control ✓</div>' },

      { kw: ['强制规则','体检','preflight','检查10','分支保护','几项检查'], reply: '防御体系包括：①4条强制规则（触发复核、先核实再动手、Windows文本编码、hotfix白名单）②10项preflight自动体检（第10项=图片完整性，防止二进制被当文本写坏）③CI闸门2步（preflight+凭证校验）④门禁兜底（未盖章 commit 的 Review gate 失败、Deploy 拦截）。<div class="tool-call">portfolio_kb → dual_agent_collab ✓</div>' },

      { kw: ['作者','你是谁','胡凯','背景','个人','介绍'], reply: '作者胡凯，2001年生，浙江宁波人。教育：精算学（辅修金融）本科（惠灵顿维多利亚大学）+ 金融与投资学（专业会计）硕士（宁波诺丁汉大学，2025.09-2027.07）。实习：智马达 smart 汽车（奔驰 × 吉利）资金部（2026.05-2026.10）+ 中审众环会计师事务所审计（2025.12-2026.03）。定位：懂业务+懂数据+懂AI的财务数字化人才。<div class="tool-call">portfolio_kb → author ✓</div>' },

      { kw: ['教育','学历','学校','大学','专业','硕士','本科'], reply: '教育背景：<br>• <b>硕士</b>：宁波诺丁汉大学，金融与投资学（专业会计），2025.09-2027.07<br>• <b>本科</b>：新西兰惠灵顿维多利亚大学，精算学（辅修金融）<br><br>精算本科打下数学建模和风险量化基础，金融会计硕士补充财务和投资知识，形成"量化+财务"复合背景。<div class="tool-call">portfolio_kb → author ✓</div>' },

      { kw: ['实习','工作','经历','smart','汽车','资金部','资金方向','资金运营','审计'], reply: '实习经历：<br>• <b>智马达 smart 汽车（奔驰 × 吉利）资金部</b>（2026.05-至今）：参与子公司流动资金贷款全流程（材料准备、提款、贷后台账），运用 SAP 完成集团资金台账与多银行账户数据归集，参与集团银行授信、供应链融资、跨境付汇与外汇申报<br>• <b>中审众环会计师事务所 审计实习</b>（2025.12-2026.03）：使用Python开展财务数据清洗与指标波动归因分析，参与制造业、房地产、私募基金年报审计，独立负责货币资金、往来款、固定资产等核心科目底稿<br><br>这些实习中的观察和思考，是作品集所有作品的灵感来源。<div class="tool-call">portfolio_kb → author ✓</div>' },

      { kw: ['技能','能力','会什么','技术栈','工具','python','sql','sap'], reply: '核心技能：<br>• <b>财务专业</b>：资金管理、财务报表、审计底稿、SOX内控、精算建模<br>• <b>数据工具</b>：Python(Pandas/NumPy/Matplotlib)、SQL、Excel高级函数、SAP<br>• <b>AI应用</b>：大语言模型API调用、Agent工作流设计、RAG检索增强、提示词工程<br>• <b>建模能力</b>：蒙特卡洛模拟、均值回归模型(Vasicek)、利率风险与融资成本建模<br><br>技术栈：原生HTML+CSS+JS、ECharts可视化、DeepSeek API、多Agent协作体系。<div class="tool-call">portfolio_kb → techStack ✓</div>' },

      { kw: ['求职','方向','目标','岗位','职业','规划','找工作'], reply: '求职方向：2027届秋招，聚焦财务数字化、资金管理、AI+财务复合岗位。目标岗位：头部科技企业 AI Builder、制造企业财务数字化/资金岗、银行资金运营/国际财税。<br><br>职业规划：短期成为"懂业务+懂数据+懂AI"的复合型财务人才，长期探索AI在财务领域的深度应用。<div class="tool-call">portfolio_kb → purpose ✓</div>' },

      { kw: ['为什么','做这个','动机','初衷','想法','来源'], reply: '这个作品集的核心作品，来自实习中的观察和深度思考：<br>• 在 智马达 smart 汽车（奔驰 × 吉利）做资金实习时，发现资金经理判断利率靠"依赖定性研判与银行单方报价"，没有可验证的分析框架，于是做了 LPR 走势预测与融资成本压力测试<br><br>我是实习生，这个作品没有落地到公司实际业务中，但体现了我从业务问题出发、用精算方法和 AI 工具尝试解决问题的思考过程。<div class="tool-call">portfolio_kb → purpose ✓</div>' },

      { kw: ['核心','亮点','优势','特长','厉害'], reply: '核心亮点：<br>① <b>复合背景</b>：精算本科+金融会计硕士+资金/审计实习<br>② <b>从业务出发</b>：所有作品都来自真实实习场景的观察和思考<br>③ <b>动手能力</b>：从想法到可交互Demo全部独立完成<br>④ <b>质量控制</b>：把金融机构的「经办—复核—审批（Maker-Checker）」机制搬到数据建模——AI 生成计算代码、换模型独立验算、本人核验勾稽关系与口径后放行。<div class="tool-call">portfolio_kb → keyNumbers ✓</div>' },

            { kw: ['w03','lpr','利率','预测','蒙特卡洛','融资成本','贷款定价','净息差','MLF','社融','CPI'], reply: '旗舰作品：LPR 走势预测与融资成本压力测试。<br><br>方法：四指标分析框架（MLF政策利率/银行净息差/社融/CPI）+ 利率均值回归模型（Vasicek）+ 蒙特卡洛模拟（10,000条路径）+ 1Y/5Y双期限建模 + 融资成本敏感性分析。<br><br>产出：未来60个月LPR预测区间（10%/50%/90%分位数）、5年后LPR概率分布、情景概率（基准60%/偏鸽25%/持稳15%）、不同利率情景下的融资成本压力测试。<br><br>特点：参数诚实标注为"演示设定，非市场校准"，模型公式和Python源码全部公开可复现。<div class="tool-call">portfolio_kb → works[0] ✓</div>' },

                  { kw: ['局限','不足','结论','口径','研究结论','局限性'], reply: '关于作品的局限和结论，整体说明：<br><br>• <b>结论</b>：LPR 短期（6个月内）持稳概率大（净息差 1.41% 历史低位限制让利空间），中期（1-3年）温和下行，5Y 会比 1Y 降得更快（地产政策定向引导）<br>• <b>局限</b>：参数（θ/κ/σ）为演示设定非市场校准；宏观情景概率基于公开数据推断；模型假设变量线性相关，极端情景可能失效<br>• <b>建议</b>：预测用于决策参考，重大融资决策仍需结合公司敞口与银行报价复核。<div class="tool-call">portfolio_kb → works[0] ✓</div>' },

      { kw: ['数据','真实','真的吗','编造','模拟','来源','可靠','可信','误差','落地','应用','实际使用'], reply: '关于数据真实性，我分三类说明：<br><br>• <b>公开数据</b>：页面标注来源的宏观/市场数据来自公开渠道<br>• <b>模拟数据</b>：LPR 蒙特卡洛预测的具体数值是演示用模拟数据，参数和口径在每个作品的"数据口径与假设说明"里写清楚了<br>• <b>方法论真实</b>：模型公式（Vasicek、蒙特卡洛）、精算方法都是真实的，Python源码公开可复现<br><br>我是实习生，没有权限使用公司真实数据，所以用模拟数据验证方法的可行性。这一点我在作品集里反复强调，不夸大。<div class="tool-call">portfolio_kb → keyNumbers ✓</div>' },

      { kw: ['算错','错误','准确','靠谱','会不会错','质疑'], reply: '说实话，确实算错过。<br><br>早期搭 LPR 蒙特卡洛模型时，Vasicek 参数（θ/κ）初始设定与历史校准口径不一致，导致预测区间偏窄，被 DeepSeek 复核查出来并修正了。<br><br>这也是我做双Agent复核机制的原因——AI自己写的东西自己查不出来，必须有独立复核。现在作品集有preflight自动体检 + DeepSeek人工复核两道关。<br><br>财务/审计/精算里，"不确定就说不确定"比"像模像样地编一个"重要得多。<div class="tool-call">portfolio_kb → defect_log ✓</div>' },

      { kw: ['gpa','成绩','绩点','排名','学习'], reply: '学业表现：硕士阶段GPA位于专业前10%。本科精算学（辅修金融）侧重数学建模和风险量化，硕士金融与投资学（专业会计）侧重财务和投资分析。<br><br>具体成绩单可以看简历，这里就不展开了。<div class="tool-call">portfolio_kb → author ✓</div>' },



    ]  },



  // 匹配离线回复（按场景）

  offlineMatch: function(text, scene) {

    var t = text.toLowerCase();

    var lib = this.offlineReplies[scene] || this.offlineReplies.portfolio || [];

    for (var i = 0; i < lib.length; i++) {

      var r = lib[i];

      for (var j = 0; j < r.kw.length; j++) {

        if (t.indexOf(r.kw[j].toLowerCase()) > -1) return r.reply;

      }

    }

    return null;

  },



  // 离线正式回答：KB 检索优先（三级策略）→ 话术兜底 → 越界模板

  buildOfflineAnswer: function(text, fallbackMsg) {

    var t0 = text.toLowerCase();

    // v7.0 已删主题拦截（发票/现金流/供应链/SOX/资金智算/w01/w07 已从作品集移除，问到时明确拒答，防止答非所问）

    // v7.0 已删主题拦截：短语级匹配避免误伤 LPR 正当问法（如"蒙特卡洛抽样路径""企业现金流影响"）；LPR 意图优先，拦截仅在未命中任何 LPR 话术时生效

    var REMOVED = ['发票','发票预审','核验','勾稽','三通道','现金流压力测试','现金流预测','资金缺口','供应链','sox工作台','sox审计','sox抽样','抽样量','抽样公式','资金智算','w01','w07'];

    for (var ri = 0; ri < REMOVED.length; ri++) {

      if (t0.indexOf(REMOVED[ri]) > -1) {

        return '这个问题超出了作品集的范围 🙂 作品集当前只保留一个旗舰作品：LPR 走势预测与融资成本压力测试系统（发票核验、现金流压力测试等早期作品已从作品集移除）。你问的这方面内容不在作品集里，但如果你想了解 LPR 预测的方法、数据或局限，可以直接问我。';

      }

    }

    var hits = (this.kbSearch(text) || []).filter(function(h){ return h.type === 'work'; });

    var top = hits[0];

    // 强相关（≥2.0）：直接答 KB 原文

    if (top && top.score >= 2.0) {

      var hl = '';

      if (this.portfolioKB && this.portfolioKB.structure) {

        for (var i = 0; i < this.portfolioKB.structure.length; i++) {

          if (this.portfolioKB.structure[i].id === top.id && this.portfolioKB.structure[i].highlights) {

            hl = '\n\n要点：\n· ' + this.portfolioKB.structure[i].highlights.slice(0, 3).join('\n· ');

            break;

          }

        }

      }

      return '**' + top.name + '**\n' + (top.summary || '') + hl +

             '\n\n（以上来自作品集知识库，可点下方按钮直达该作品）';

    }

    // 人工话术兜底（精度更高，优先于弱相关引导）

    var canned = this.offlineMatch(text, 'portfolio');

    if (canned) return canned;

    // 弱相关（1.0-1.9）：引导，不硬答

    if (top && top.score >= 1.0) {

      return '你的问题可能和 **' + top.name + '** 有关，要不要先看看这个作品？' +

             '\n\n如果你问的是别的方面，可以换个说法——比如"数据从哪来""有什么局限"。';

    }

    // 越界模板：记录未命中问法到localStorage（仅本地，不上传）

    try {

      var misses = JSON.parse(localStorage.getItem('portfolio_ai_misses') || '[]');

      misses.push({ q: text, t: Date.now() });

      if (misses.length > 100) misses = misses.slice(-100);

      localStorage.setItem('portfolio_ai_misses', JSON.stringify(misses));

    } catch(e) {}

    return '这个问题超出了作品集的范围 🙂 我是本地知识库模式的导览助手，只回答与作品、背景、方法论相关的内容——这样能保证每句话都有出处、不编造。\n\n你可以问我：某个作品是怎么做的 / 数据从哪来 / 有什么局限 / 和岗位的匹配度。';

  },



  // ===== 作品集知识库（v3.11 起从独立 JSON 数据块加载：结构化 summary/tags/highlights，支持作品级 RAG）=====

  portfolioKB: (function(){

    var el = document.getElementById('portfolioKB-data');

    try { return el ? JSON.parse(el.textContent) : null; }

    catch(e){ return null; }

  })(),



  // 作品集助手 persona（基于知识库动态生成）

  portfolioPersona: function() {

    var kb = this.portfolioKB;

    if(!kb){ return '你是作品集助手。'; }

    return '你是"作品集助手"——胡凯 AI×财务作品集的自我认知 AI。你的职责：向用户（胡凯本人或访客）介绍这个作品集的一切细节，并帮助发现可改进点。回答专业、简洁、结构化，中文回复，控制在 220 字以内，可用换行分点。\n\n【作品集知识库——回答必须基于以下信息，不要编造】\n作者：' + kb.author + '；定位：' + kb.purpose + '\n结构：' + JSON.stringify(kb.structure) + '\n原型：' + JSON.stringify(kb.prototypes) + '\n关键数据：' + JSON.stringify(kb.keyNumbers) + '\n技术栈：' + kb.techStack + '\n缺陷日志（已修复）：' + kb.defectLog.join('；') + '\n版本演进：' + kb.versions + '\nAI协作方法（用户问怎么和AI协作时用这个）：' + JSON.stringify(kb.dualAgentCollab) + '\n\n【行为准则】①用户问"双Agent复核机制/怎么运作/多智能体团队"→必须用dualAgentCollab信息回答，明确是本人（业务统筹与裁决）+ AI 经办（按 Actual/360 等规则生成计算代码）+ AI 复核（换模型独立验算现金流与折现结果）的三层质量控制（经办—复核—裁决）；复核结论只是输入不是判决，不要混淆资金智算原型里的Manager+Specialist①用户问"有什么功能/介绍作品"→按 structure+prototypes 导览 ②问"怎么实现的/技术"→引用 techStack+keyNumbers ③问"缺陷/修复历史"→列 defectLog ④问"迭代/版本"→列 versions ⑤问"还能怎么改进"→基于 defectLog 和当前架构给 2-3 条具体建议（如：接真实RAG、加pytest测试、数据脱敏后真实数据测试、ECharts进一步瘦身）⑥若收到【实时联网搜索结果】，先判断相关性——相关则基于结果回答，无关则忽略并直接用自己的知识回答（不要在开头提"网络搜索/搜索词"）⑦若没有搜索结果且问题是作品集外的一般问题，可直接用你的知识简要回答（不必强调"知识库未覆盖"），最后自然带一句"如需了解作品集可以问我"⑧被要求讲笑话/闲聊等非业务内容时：轻松幽默回应（可讲财务梗），简短即可，不硬切功能清单⑨用户负面反馈/质疑：先共情再理性回应，不防御性辩解。';

  },



  // ===== 知识库自动同步：从页面DOM提取最新作品信息，避免手动维护 =====

  syncKBFromDOM: function() {

    try {

      var kb = this.portfolioKB;

      if (!kb || !kb.structure) return;

      var works = document.querySelectorAll('.work');

      var synced = 0;

      works.forEach(function(el) {

        // 从onclick提取作品id: showWork('03') -> w03

        var onclick = el.getAttribute('onclick') || '';

        var m = onclick.match(/showWork\(['"](\d+)['"]\)/);

        if (!m) return;

        var wid = 'w' + m[1];

        var titleEl = el.querySelector('.title');

        var descEl = el.querySelector('.desc');

        var name = titleEl ? titleEl.textContent.trim() : '';

        var desc = descEl ? descEl.textContent.trim() : '';

        // 更新知识库中对应作品

        for (var i = 0; i < kb.structure.length; i++) {

          if (kb.structure[i].id === wid) {

            if (name) kb.structure[i].name = name;

            if (desc) kb.structure[i].desc = desc;

            synced++;

            break;

          }

        }

      });

      console.log('[知识库] 已从DOM同步 ' + synced + ' 个作品信息');

    } catch(e) { console.warn('[知识库] DOM同步失败:', e); }

  },



  // ===== 政策知识库（轻量 RAG：前端本地检索，回答附出处）=====

  policyKB: [

    { doc: '《资金管理办法》', section: '§4.2', kw: ['重复付款','同一合同','重复'], text: '同一合同、同一供应商、一周内同金额付款需人工复核；确认重复立即启动退款追回流程，审批流留痕。' },

    { doc: '《跨境资金结算操作指引》', section: '§3.1', kw: ['跨境','汇率','交割日','入账'], text: '跨境结算入账口径为交割日汇率，入账金额以银行实际交割金额为准；存在汇率差异的，差额计入汇兑损益科目。' },

    { doc: '《银行对账工作流程》', section: '§4.2', kw: ['银行','扣费','手续费','月结'], text: '银行已扣收费用账面未入账的，应补记对应科目，并将该费用纳入自动入账规则。月结 6 个工作日节点全流程。' },

    { doc: '《审计证据管理规范》', section: '§2.1', kw: ['证据','留痕','审计','追溯'], text: '资金对账异常处理须留存完整证据链：原始流水、匹配规则版本、Agent 动作日志、人工确认记录，可追溯可复核。' },

    { doc: '《未达账项处理细则》', section: '§3.2', kw: ['未达','调整','入账','内部往来'], text: '未达账项按来源分类处理：手续费类补记入账、内部往来类核对单据号后核销、退税类按周期确认。' }

  ],

  // 轻量 RAG 检索 v3.11：作品级 + 政策级双通道检索（作品级命中 tags/summary/highlights，附出处；政策级保留原打分），返回 Top 命中

  kbSearch: function(query) {

    var q = String(query || '').toLowerCase();

    var hits = [];

    var self = this;

    if(!this.portfolioKB){ return []; }

    // 通道 A：作品级知识检索（structure + prototypes 的 tags/summary/highlights）

    var works = (this.portfolioKB.structure || []).concat(this.portfolioKB.prototypes || []);

    works.forEach(function(w){

      var score = 0;

      var haystack = [w.name, w.desc, w.summary, (w.tags||[]).join(' '), (w.highlights||[]).join(' ')].join(' ').toLowerCase();

      // 标签强命中

      (w.tags || []).forEach(function(t){ if(q.indexOf(t.toLowerCase()) > -1) score += 2; });

      // 作品名连续词命中

      (w.name || '').split(/[\s·/]+/).filter(function(n){ return n.length >= 2; }).forEach(function(n){

        if(q.indexOf(n.toLowerCase()) > -1) score += 1.5;

      });

      // 摘要/亮点词共现

      q.split(/[\s，。、；：·/]+/).filter(function(wd){ return wd.length >= 2; }).forEach(function(wd){

        if(haystack.indexOf(wd) > -1) score += 0.5;

      });

      if(score > 0) hits.push({ type: 'work', id: w.id, name: w.name || '', summary: w.summary || w.desc || '', tags: (w.tags||[]).join('/'), score: score });

    });

    // 通道 B：政策级检索（原打分逻辑）

    this.policyKB.forEach(function(p){

      var score = 0;

      p.kw.forEach(function(k){ if(q.indexOf(k.toLowerCase()) > -1) score += 1; });

      var textWords = p.text.replace(/[，。；、：（）]/g, ' ').split(/\s+/).filter(function(w){ return w.length >= 2; });

      textWords.forEach(function(w){ if(q.indexOf(w) > -1) score += 0.5; });

      if(/(依据|规定|办法|指引|政策|条款|怎么处理|如何入账|合规|依据什么)/.test(q)) score += 0.5;

      if(p.section && q.indexOf(p.section.toLowerCase()) > -1) score += 3;

      if(score > 0) hits.push({ type: 'policy', doc: p.doc, section: p.section, text: p.text, score: score });

    });

    hits.sort(function(a,b){ return b.score - a.score; });

    return hits.slice(0, 4);

  },

  // 兼容旧调用：政策通道单独检索

  policySearch: function(query) {

    var q = String(query || '').toLowerCase();

    var hits = [];

    this.policyKB.forEach(function(p){

      var score = 0;

      p.kw.forEach(function(k){ if(q.indexOf(k.toLowerCase()) > -1) score += 1; });

      var textWords = p.text.replace(/[，。；、：（）]/g, ' ').split(/\s+/).filter(function(w){ return w.length >= 2; });

      textWords.forEach(function(w){ if(q.indexOf(w) > -1) score += 0.5; });

      if(/(依据|规定|办法|指引|政策|条款|怎么处理|如何入账|合规|依据什么)/.test(q)) score += 0.5;

      if(p.section && q.indexOf(p.section.toLowerCase()) > -1) score += 3;

      if(score > 0) hits.push({ doc: p.doc, section: p.section, text: p.text, score: score });

    });

    hits.sort(function(a,b){ return b.score - a.score; });

    return hits.slice(0, 3);

  },



  // 调用真实 DeepSeek API（v3.11 支持 SSE 流式：onDelta 增量回调；无 ReadableStream 自动回退非流式）

  callAPI: function(messagesOrText, persona, callback, onDelta) {

    var self = this;

    // 没有 API Key 时直接走离线兜底，不发起网络请求

    if (!this.apiKey) {

      setTimeout(function(){ callback(new Error('No API key'), null, null); }, 0);

      return;

    }

    var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;

    var timer = setTimeout(function(){ if (controller) controller.abort(); }, this.timeoutMs);

    // 兼容两种调用：callAPI(text, persona, cb) 或 callAPI(messagesArray, persona, cb)

    var msgs;

    if (typeof messagesOrText === 'string') {

      msgs = [

        { role: 'system', content: persona },

        { role: 'user', content: messagesOrText }

      ];

    } else if (Array.isArray(messagesOrText)) {

      msgs = [{ role: 'system', content: persona }].concat(messagesOrText);

    } else {

      msgs = [{ role: 'system', content: persona }, { role: 'user', content: String(messagesOrText) }];

    }

    var canStream = typeof ReadableStream !== 'undefined' && typeof TextDecoder !== 'undefined' && !!onDelta;

    fetch(this.apiUrl, {

      method: 'POST',

      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.apiKey },

      body: JSON.stringify({

        model: this.model,

        messages: msgs,

        max_tokens: 1200,

        temperature: 0.7,

        stream: canStream

      }),

      signal: controller ? controller.signal : undefined

    })

    .then(function(res){

      if (!res.ok) throw new Error('HTTP ' + res.status);

      if (canStream && res.body && res.body.getReader) {

        // ===== SSE 流式路径：逐块解析 delta.content，中断时保留已渲染部分 =====

        var reader = res.body.getReader();

        var decoder = new TextDecoder('utf-8');

        var buf = '', full = '', interrupted = false;

        function pump(){

          reader.read().then(function(result){

            if (result.done) {

              clearTimeout(timer);

              callback(null, full, { stream: true, interrupted: interrupted });

              return;

            }

            buf += decoder.decode(result.value, { stream: true });

            var lines = buf.split('\n');

            buf = lines.pop();

            lines.forEach(function(line){

              if (line.indexOf('data:') !== 0) return;

              var data = line.slice(5).trim();

              if (data === '[DONE]') return;

              try {

                var obj = JSON.parse(data);

                var delta = obj.choices && obj.choices[0] && obj.choices[0].delta && obj.choices[0].delta.content;

                if (delta) { full += delta; onDelta(delta, false); }

              } catch(e){}

            });

            pump();

          }).catch(function(err){

            // 中断（超时 abort / 网络断开）：保留已渲染的半截文本 + 中断标记

            clearTimeout(timer);

            interrupted = true;

            if (full) { callback(null, full, { stream: true, interrupted: true }); }

            else { callback(err, null); }

          });

        }

        pump();

        return;

      }

      return res.json();

    })

    .then(function(data){

      if (!data) return;

      clearTimeout(timer);

      if (data && data.choices && data.choices[0] && data.choices[0].message) {

        callback(null, data.choices[0].message.content, { stream: false });

      } else {

        callback(data || new Error('API 无有效返回'), null);

      }

    })

    .catch(function(err){

      clearTimeout(timer);

      callback(err, null);

    });

  },



  // 统一入口：真实 AI 优先，失败自动重试 1 次，再降级离线

  ask: function(text, persona, fallbackMsg, callback, scene) {

    var self = this;

    var attempts = 0;

    function tryCall() {

      attempts++;

      self.callAPI(text, persona, function(err, content){

        if (!err && content) {

          callback(content, true);

        } else if (attempts < 2) {

          // 首次失败：重试一次（偶发超时/网络抖动）

          setTimeout(tryCall, 300);

        } else {

          // 二次失败：降级（先试关键词，再试兜底话术）

          var offline = (scene === 'cashflow') ? self.offlineMatch(text, 'cashflow') : self.buildOfflineAnswer(text, fallbackMsg);

          callback(offline || fallbackMsg, false);

        }

      });

    }

    tryCall();

  },



  // ===== 联网搜索（可选增强：成功注入上下文，失败自动降级）=====

  // 搜索源顺序：百度搜索建议（JSONP，国内最稳）→ 维基百科（国际）→ DuckDuckGo（兜底）

  webSearch: function(query, callback, timeoutMs) {

    var self = this;

    var finished = false;

    var timeout = setTimeout(function(){ if(!finished){ finished=true; cleanup(); callback(new Error('搜索超时'), null); } }, timeoutMs || 4000);



    var jsonpScript = null;

    var jsonpTries = 0;

    function cleanup(){

      if(jsonpScript && jsonpScript.parentNode) jsonpScript.parentNode.removeChild(jsonpScript);

      jsonpScript = null;

    }

    function done(err, result){

      if(finished) return;

      finished=true; clearTimeout(timeout); cleanup();

      callback(err, result);

    }



    // 搜索源 1：百度搜索建议（JSONP 方式，绕过 CORS）

    function tryBaidu(){

      if(finished) return;

      var cbName = '__bd_su_' + Date.now() + '_' + (++jsonpTries);

      window[cbName] = function(data){

        try{ delete window[cbName]; }catch(e){ window[cbName] = undefined; }

        if(finished) return;

        if(data && data.s && data.s.length){

          var lines = data.s.slice(0,10).map(function(t,i){ return (i+1)+'. '+t; });

          done(null, '【百度搜索建议（相关搜索词）】\n'+lines.join('\n')+'\n（注：这些是百度用户常搜的相关词，可作为回答方向参考）');

        } else {

          tryWiki();

        }

      };

      jsonpScript = document.createElement('script');

      jsonpScript.src = 'https://suggestion.baidu.com/su?wd='+encodeURIComponent(query)+'&p=3&cb='+cbName;

      jsonpScript.onerror = function(){ try{ delete window[cbName]; }catch(e){} tryWiki(); };

      document.head.appendChild(jsonpScript);

    }

    // 搜索源 2：Wikipedia opensearch（支持 CORS: origin=*）

    function tryWiki(){

      if(finished) return;

      var url='https://zh.wikipedia.org/w/api.php?action=opensearch&search='+encodeURIComponent(query)+'&limit=5&format=json&origin=*';

      fetch(url).then(function(r){return r.json();}).then(function(d){

        if(d && d[1] && d[1].length){

          var items=d[1], descs=d[2]||[];

          var lines=items.map(function(t,i){

            var desc=descs[i]&&descs[i].length?(' - '+descs[i].slice(0,120)):'';

            return (i+1)+'. '+t+desc;

          });

          done(null, '【维基百科搜索结果】\n'+lines.join('\n'));

        } else {

          tryDDG();

        }

      }).catch(function(){ tryDDG(); });

    }

    // 搜索源 3：DuckDuckGo Instant Answer（兜底）

    function tryDDG(){

      if(finished) return;

      var url='https://api.duckduckgo.com/?q='+encodeURIComponent(query)+'&format=json&no_html=1&skip_disambig=1';

      fetch(url).then(function(r){return r.json();}).then(function(d){

        var texts=[];

        if(d && d.AbstractText && d.AbstractText.length) texts.push(d.AbstractText.slice(0,300));

        if(d && d.RelatedTopics){

          d.RelatedTopics.slice(0,5).forEach(function(t){

            if(t && t.Text && texts.length<6) texts.push(t.Text.slice(0,150));

          });

        }

        if(texts.length){

          done(null, '【DuckDuckGo 搜索结果】\n'+texts.map(function(t,i){return (i+1)+'. '+t;}).join('\n'));

        } else {

          done(null, null);

        }

      }).catch(function(){ done(null, null); });

    }

    tryBaidu();

  },



  // 多轮对话入口：传历史 messages（不含 system，persona 单独传）；onDelta 为流式增量回调（可选）

  askWithHistory: function(history, persona, fallbackMsg, callback, scene, onDelta) {

    var self = this;

    var attempts = 0;

    function tryCall() {

      attempts++;

      self.callAPI(history, persona, function(err, content, meta){

        if (!err && content) {

          callback(content, true, meta);

        } else if (attempts < 2) {

          setTimeout(tryCall, 300);

        } else {

          // 降级：用最后一条用户消息做关键词匹配

          var lastUser = '';

          for (var i = history.length - 1; i >= 0; i--) {

            if (history[i] && history[i].role === 'user') { lastUser = history[i].content; break; }

          }

          var offline = (scene === 'cashflow') ? self.offlineMatch(lastUser, 'cashflow') : self.buildOfflineAnswer(lastUser, fallbackMsg);

          callback(offline || fallbackMsg, false);

        }

      }, onDelta);

    }

    tryCall();

  }

};

// Scroll reveal animation

const io=new IntersectionObserver((es)=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12,rootMargin:'0px 0px -40px 0px'});

document.querySelectorAll('.reveal').forEach(el=>io.observe(el));



// Mobile menu toggle

(function(){

  const btn=document.getElementById('menuBtn');

  const nav=document.getElementById('nav');

  if(!btn||!nav) return;

  btn.addEventListener('click',()=>{

    const open=nav.classList.toggle('open');

    btn.classList.toggle('active',open);

    btn.setAttribute('aria-expanded',open?'true':'false');

  });

  // Close menu when a nav link is clicked

  nav.querySelectorAll('a').forEach(a=>{

    a.addEventListener('click',()=>{

      nav.classList.remove('open');

      btn.classList.remove('active');

      btn.setAttribute('aria-expanded','false');

    });

  });

  // Close menu when clicking outside

  document.addEventListener('click',(e)=>{

    if(!nav.contains(e.target)&&!btn.contains(e.target)&&nav.classList.contains('open')){

      nav.classList.remove('open');

      btn.classList.remove('active');

      btn.setAttribute('aria-expanded','false');

    }

  });

})();



// ===== 作品集助手（悬浮 AI · v3.11 大更新：流式/快捷提问/快速导览/可填Key/作品跳转）=====

(function(){

  var fab=document.getElementById('assistantFab');

  var panel=document.getElementById('assistantPanel');

  var closeBtn=document.getElementById('assistantClose');

  var body=document.getElementById('assistantBody');

  var input=document.getElementById('assistantInput');

  var sendBtn=document.getElementById('assistantSend');

  var welcome=document.getElementById('assistantWelcome');

  var gear=document.getElementById('assistantGear');

  var settings=document.getElementById('assistantSettings');

  var keyInput=document.getElementById('assistantKeyInput');

  var keySave=document.getElementById('assistantKeySave');

  var stateDot=document.getElementById('assistantStateDot');

  var titleEl=document.getElementById('assistantTitle');

  if(!fab||!panel||!body||!input||!sendBtn) return;



  // ---- 记忆系统（localStorage 持久化，v3.11 滑动窗口：16 条 + 摘要压缩）----

  var LS_KEY='smartrecon_assistant_memory_v2';

  var memory={ history:[], notes:[], summary:'' }; // history=最近轮次(≤16条=8轮), notes=显式记忆, summary=更早对话摘要

  try{

    var saved=localStorage.getItem(LS_KEY);

    if(saved){ var parsed=JSON.parse(saved); if(parsed&&parsed.history)memory=parsed; }

  }catch(e){}

  function saveMemory(){

    try{ localStorage.setItem(LS_KEY,JSON.stringify(memory)); }catch(e){}

  }

  function addHistory(role,content){

    memory.history.push({role:role,content:content});

    // 滑动窗口：超 16 条把最早 2 条压进摘要（一条摘要行，控制 token）

    while(memory.history.length>16){

      var old=memory.history.shift();

      memory.summary=(old.role==='user'?'用户':'助手')+'：'+String(old.content||'').slice(0,80)+(memory.summary?' | '+memory.summary:'');

      if(memory.summary.length>400) memory.summary=memory.summary.slice(0,400)+'…';

    }

    saveMemory();

  }

  function getNotesText(){

    if(!memory.notes||!memory.notes.length) return '（暂无）';

    return memory.notes.map(function(n,i){return (i+1)+'. '+n;}).join('；');

  }



  function escapeHtml(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]});}

  // 简单Markdown渲染：**加粗**、换行（先转义HTML再替换Markdown，避免XSS）

  // 安全提取tool-call徽标：只取内部文本，标签由我方代码生成（防止XSS）

  function splitBadges(s){

    var str = String(s || ''), badges = '';

    str = str.replace(/<div class="tool-call">([\s\S]*?)<\/div>/g, function(_, inner){

      badges += '<div class="tool-call">' + escapeHtml(inner.replace(/<[^>]*>/g, '')) + '</div>';

      return '';

    });

    return { plain: str, badges: badges };

  }

  function renderMd(s){

    var p = splitBadges(s);

    return escapeHtml(p.plain).replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>') + p.badges;

  }

  function addMsg(role,html,persist){

    var row=document.createElement('div');

    row.className='msg-row '+(role==='user'?'user':'ai');

    row.innerHTML='<div class="msg-avatar">'+(role==='user'?'胡凯':'AI')+'</div><div class="msg-bubble">'+html+'</div>';

    body.appendChild(row);

    body.scrollTop=body.scrollHeight;

    if(persist===false)return;

    var plain=row.querySelector('.msg-bubble').textContent;

    addHistory(role,plain);

  }



  // ---- 头部状态点（三态：🟢真实AI / 🟡离线 / 🔵本地知识命中）----

  function setState(color,label){

    if(!stateDot) return;

    stateDot.style.background=color;

    stateDot.style.boxShadow='0 0 10px '+color;

    stateDot.title=label;

  }

  function setTitle(t){ if(titleEl) titleEl.textContent=t; }





  // ---- v7.2：面试模式已移除（用户拍板，助手专注导览与复盘）----



  // ---- 快捷提问与快速导览（欢迎态两层 UI）----

  var quickQs=[

    {icon:'📊',text:'这个作品集的核心亮点是什么？',q:'这个作品集的核心亮点是什么？'},

    {icon:'🎯',text:'最能体现精算能力的作品是哪个？',q:'最能体现精算能力的作品是哪个？'},

    {icon:'💼',text:'作者的财务和AI背景怎么结合的？',q:'作者的财务和AI背景怎么结合的？'},

    {icon:'🤖',text:'双Agent复核机制是怎么运作的？',q:'双Agent复核机制是怎么运作的？'},

  ];

  var navItems=[

    {id:'04',name:'AI 司库系统',n:'W04'},

    {id:'03',name:'LPR 走势预测',n:'W03'},

    {id:'00',name:'AI协作经验',n:'W00'}

  ];

  function buildWelcome(){

    if(!welcome) return;

    var chips=document.getElementById('quickChips');

    if(chips){

      quickQs.forEach(function(item){

        var c=document.createElement('button');

        c.className='quick-item';

        c.innerHTML='<span class="qi-icon">'+item.icon+'</span><span class="qi-text">'+escapeHtml(item.text)+'</span><span class="qi-arrow">→</span>';

        c.addEventListener('click',function(){

          input.value=item.q;

          input.focus();

          send();

        });

        chips.appendChild(c);

      });

    }

    var nav=document.getElementById('quickNav');

    if(nav){

      navItems.forEach(function(it){

        var c=document.createElement('button');

        c.className='nav-card';

        c.innerHTML='<span class="nv-tag">'+it.n+'</span><span>'+escapeHtml(it.name)+'</span>';

        c.addEventListener('click',function(){

          if(window.showWork) window.showWork(it.id);

          panel.classList.remove('open');

        });

        nav.appendChild(c);

      });

    }

  }

  buildWelcome();

  function hideWelcome(){ if(welcome) welcome.style.display='none'; }



  // ---- 作品跳转按钮（回答中嵌入「查看这个作品 →」）----

  function mapReplyToWork(reply){

    try{

      var kb=window.SmartReconAI&&window.SmartReconAI.portfolioKB;

      if(!kb||!kb.structure) return null;

      for(var i=0;i<kb.structure.length;i++){

        var w=kb.structure[i];

        if(w.id==='home') continue;

        var names=[w.name].concat((w.tags||[]).slice(0,3));

        for(var j=0;j<names.length;j++){

          if(names[j]&&reply.indexOf(names[j])>-1) return {id:w.id.replace('w',''),name:w.name};

        }

      }

    }catch(e){}

    return null;

  }

  // 点击委托：跳转按钮（showWork由全局捕获委托统一处理，这里只负责关闭助手面板）

  body.addEventListener('click',function(e){

    var t=e.target;

    while(t&&t!==body&&!(t.classList&&t.classList.contains('jump-btn'))) t=t.parentNode;

    if(t&&t!==body&&t.dataset&&t.dataset.work){

      panel.classList.remove('open');

    }

  });



  // ---- 主动导览：强模式匹配「打开/展示/跳到 + 数字或作品名」----

  var NAV_VERBS=/(打开|展示|跳到|跳转|进入|看看|前往|导览|带我去|给我看)/;

  var NAV_NUM=/(?:打开|展示|跳到|跳转|进入|看看|前往|导览|带我去|给我看)[^\d]{0,6}([1-9])(?:个|号|个作品|作品)?/;

  var NAV_NAMES=[

    {id:'03',kw:['lpr','利率','预测','蒙特卡洛','净息差','MLF','社融','CPI','贷款定价','融资成本']}

  ];

  function parseNav(text){

    var t=String(text).toLowerCase();

    var m=t.match(NAV_NUM);

    if(m) return ('0'+m[1]).slice(-2);

    for(var i=0;i<NAV_NAMES.length;i++){

      for(var j=0;j<NAV_NAMES[i].kw.length;j++){

        if(t.indexOf(NAV_NAMES[i].kw[j])>-1) return NAV_NAMES[i].id;

      }

    }

    return null;

  }



  fab.addEventListener('click',function(){

    panel.classList.toggle('open');

    if(panel.classList.contains('open')) input.focus();

  });

  closeBtn.addEventListener('click',function(){panel.classList.remove('open');});



  // ---- 启动：恢复自定义 Key（sessionStorage 内存态，刷新即清）----

  try{

    var savedKey=sessionStorage.getItem('smartrecon_custom_key');

    if(savedKey&&window.SmartReconAI){ window.SmartReconAI.apiKey=savedKey; }

  }catch(e){}

  // 设置初始状态：有Key显示真实AI模式，无Key显示隐私保护模式

  if(window.SmartReconAI && window.SmartReconAI.apiKey){

    setState('#34d399','真实 AI 模式');

  } else {

    setState('#fbbf24','隐私保护模式 · 点⚙体验真实AI');

  }

  if(gear){

    gear.addEventListener('click',function(){ settings.classList.toggle('open'); });

  }

  if(keySave){

    keySave.addEventListener('click',function(){

      var k=(keyInput.value||'').trim();

      if(!k) return;

      try{ sessionStorage.setItem('smartrecon_custom_key',k); }catch(e){}

      window.SmartReconAI.apiKey=k;

      settings.classList.remove('open');

      keyInput.value='';

      setState('#34d399','自定义模型');

      addMsg('assistant','<div style="font-size:12px;color:#34d399;">已切换自定义模型 Key（仅存内存，刷新即清）✓</div>',false);

    });

  }



  // 未命中问题管理

  function updateMissesCount(){

    try{

      var misses=JSON.parse(localStorage.getItem('portfolio_ai_misses')||'[]');

      var el=document.getElementById('missesCount');

      if(el) el.textContent='当前记录：'+misses.length+' 条';

    }catch(e){}

  }

  updateMissesCount();

  var exportBtn=document.getElementById('exportMisses');

  if(exportBtn){

    exportBtn.addEventListener('click',function(){

      try{

        var misses=JSON.parse(localStorage.getItem('portfolio_ai_misses')||'[]');

        if(misses.length===0){ alert('暂无未命中记录'); return; }

        var lines=misses.map(function(m,i){

          var d=new Date(m.t);

          return (i+1)+'. ['+d.toLocaleString()+'] '+m.q;

        });

        var blob=new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'});

        var url=URL.createObjectURL(blob);

        var a=document.createElement('a');

        a.href=url; a.download='未命中问题_'+new Date().toISOString().slice(0,10)+'.txt';

        a.click(); URL.revokeObjectURL(url);

      }catch(e){ alert('导出失败：'+e.message); }

    });

  }

  var clearBtn=document.getElementById('clearMisses');

  if(clearBtn){

    clearBtn.addEventListener('click',function(){

      if(confirm('确定清除所有未命中记录吗？此操作不可恢复。')){

        try{ localStorage.removeItem('portfolio_ai_misses'); }catch(e){}

        updateMissesCount();

      }

    });

  }



  // 发送主流程

  function send(){

    var text=input.value.trim();

    if(!text)return;

    hideWelcome();

    addMsg('user',escapeHtml(text));

    input.value='';

    input.style.height='38px';

    var thinkId='asst-'+Date.now();

    addMsg('assistant','<span id="'+thinkId+'"><span class="typing-dots"><span></span><span></span><span></span></span></span>',false);

    var thinkEl=document.getElementById(thinkId);

    sendBtn.disabled=true;





    // ③ 查记忆指令

    var queryMem=/记住过|记了什么|我的记忆|memor(y|ies)|看看记忆|有什么记忆/i.test(text)&&!/记住[：:]\s*\S/.test(text);

    if(queryMem){

      if(thinkEl) thinkEl.outerHTML='🧠 <b>我的长期记忆</b>：'+escapeHtml(getNotesText());

      sendBtn.disabled=false;

      return;

    }

    // ④ 显式记忆指令

    var noteMatch=text.match(/记住[：:]\s*(.+)/);

    var note=noteMatch?noteMatch[1].trim():'';

    if(note){

      memory.notes.push('['+new Date().toLocaleDateString('zh-CN')+'] '+note);

      if(memory.notes.length>30) memory.notes=memory.notes.slice(-30);

      saveMemory();

      if(thinkEl) thinkEl.outerHTML='已记住：'+escapeHtml(note)+'<div style="font-size:12px;color:#34d399;margin-top:6px;">已存入长期记忆 ✓</div>';

      sendBtn.disabled=false;

      return;

    }



    // ⑤ 主动导览：强模式匹配 → 打开作品

    if(NAV_VERBS.test(text)){

      var navTarget=parseNav(text);

      if(navTarget){

        if(thinkEl) thinkEl.outerHTML='<span id="'+thinkId+'">🧭 正在打开第 '+navTarget+' 个作品…</span>';

        setTimeout(function(){

          if(window.showWork) window.showWork(navTarget);

          panel.classList.remove('open');

        },400);

        sendBtn.disabled=false;

        return;

      }

    }



    // ===== 联网搜索判断 =====

    var localPattern=/作品|功能|缺陷|改进|版本|资金智算|助手|你是谁|你叫什么|你有什么|你的|导览|技术|实现|ROI|数据底座|知识库|原型|记忆|记住|演示|怎么做的|怎么实现|做了什么|能做什么|有什么能力|介绍一下|介绍下|讲讲|说说|复盘|迭代|评估体系|LangGraph|MCP|RAG|Demo|demo|资金|审计|支付|收入|供应链|协作|bug|缺陷|财务|看板|现金流|压力测试|精算|蒙特卡洛|VaR/;

    var isLocalQuestion=localPattern.test(text);

    var webEnabled=webOn&&!isLocalQuestion;

    var reqSeq=0;



    function askAI(searchResult){

      var mySeq=++reqSeq;

      // v3.11：滑动窗口 + 摘要注入（只送最近 8 轮 + 更早摘要）

      var histText=(memory.summary?'【更早对话摘要】'+memory.summary+'\n':'')+

        memory.history.slice(0,-1).map(function(m){return (m.role==='user'?'用户':'助手')+'：'+String(m.content).slice(0,150);}).join('\n');

      var persona=window.SmartReconAI.portfolioPersona()+

        '\n\n【你的长期记忆】'+getNotesText()+

        (histText?('\n\n【对话历史】'+histText):'');

      // v3.11：RAG 升级——作品级 + 政策级双通道检索，命中注入上下文并附出处

      var kbHits=window.SmartReconAI.kbSearch(text);

      var workHits=kbHits.filter(function(h){return h.type==='work';});

      var policyHits=kbHits.filter(function(h){return h.type==='policy';});

      if(workHits&&workHits.length){

        var workText=workHits.map(function(h){return '【作品】'+h.name+'（'+(h.tags||'')+'）：'+(h.summary||'');}).join('\n');

        persona+='\n\n【本地作品知识库命中（RAG 检索结果，回答必须基于以下信息，可附出处作品名）】\n'+workText;

        setState('#6d7cff','本地知识命中');

      }

      if(policyHits&&policyHits.length){

        var policyText=policyHits.map(function(h){return '《'+h.doc.replace(/《|》/g,'')+'》'+h.section+'：'+h.text;}).join('\n');

        persona+='\n\n【本地政策知识库命中（RAG 检索结果，回答必须引用并附出处章节）】\n'+policyText;

      }

      if(searchResult){

        persona+='\n\n【实时联网搜索结果（优先参考，回答时注明信息来源）】\n'+searchResult.slice(0,1200);

      }

        persona+='\n\n【行为】①用户说"记住：xxx"→存入长期记忆 ②用户问记忆→展示 ③回答时引用相关记忆 ④保持助手人设 ⑤有【实时联网搜索结果】时：先判断搜索结果与用户问题是否相关——若相关则基于结果回答（标注"来自网络搜索"）；若明显无关（如搜出其他话题），忽略搜索结果，按你的知识直接回答用户问题，不要在回答开头提"网络搜索/搜索词"等字样 ⑥无搜索结果且是作品集外问题：直接用你的知识自然回答（不强调"基于模型知识/建议核实"），结尾轻轻带一句"需要更深入的信息可以问我作品集相关内容" ⑦被要求讲笑话/闲聊/情感话题等非业务内容时：可以轻松幽默地回应（可讲财务梗或生活向），简短即可，不要生硬切回功能清单 ⑧用户给负面反馈或质疑时：先共情承认，再理性回应，不要防御性辩解 ⑨若用户问题缺少主语或意图模糊（如"它""这个"开头的代词问题）且上一轮你未反问过：先反问一句澄清（一句话），不要展开回答；若上一轮已反问过：直接按最合理假设回答，不要重复反问。';

      var fallback;

        fallback='已收到。当前为隐私保护模式，我可以回答作品集相关问题：作品结构、核心亮点、作者背景与能力。';

      // 流式渲染缓冲

      var streamBuf='';

      window.SmartReconAI.askWithHistory(memory.history,persona,fallback,function(reply,isAI,meta){

        if(mySeq!==reqSeq) return;

        var el=document.getElementById(thinkId);

        if(!el){ sendBtn.disabled=false; return; }

        // 流式已增量渲染：只补徽标/中断标记/跳转按钮

        if(meta&&meta.stream){

          if(meta.interrupted){

            el.insertAdjacentHTML('beforeend','<span style="color:#fbbf24">（已中断）</span>');

          }

          appendTail(el,reply,isAI,searchResult,policyHits,workHits);

          body.scrollTop=body.scrollHeight;

          sendBtn.disabled=false;

          return;

        }

        // 非流式降级（无 ReadableStream 或 API 未开流）：模拟打字机

        var badgeMode='真实 AI 模式 · deepseek-v4-flash';

        if(searchResult) badgeMode='真实 AI + 联网搜索';

        else if(policyHits&&policyHits.length) badgeMode='真实 AI + 政策库检索';

        else if(workHits&&workHits.length) badgeMode='真实 AI + 作品库检索';

        var badge=isAI?'<div style="font-size:12px;color:#34d399;margin-top:6px;">'+badgeMode+' ✓</div>':'';

        if(!isAI) setState('#fbbf24','隐私保护模式');

        el.innerHTML='';

        var plain=String(reply||'');

        var idx=0;

        var typeTimer=setInterval(function(){

          idx=Math.min(idx+2,plain.length);

          el.innerHTML=renderMd(plain.slice(0,idx))+'<span class="caret"></span>';

          body.scrollTop=body.scrollHeight;

          if(idx>=plain.length){

            clearInterval(typeTimer);

            appendTail(el,reply,isAI,searchResult,policyHits,workHits);

            body.scrollTop=body.scrollHeight;

          }

        },18);

        body.scrollTop=body.scrollHeight;

        sendBtn.disabled=false;

      },'portfolio',function(delta){

        // onDelta：SSE 流式增量渲染

        if(mySeq!==reqSeq) return;

        var el=document.getElementById(thinkId);

        if(!el) return;

        if(streamBuf===''){ el.innerHTML=''; }

        streamBuf+=delta;

        el.innerHTML=renderMd(streamBuf)+'<span class="caret"></span>';

        body.scrollTop=body.scrollHeight;

      });

    }

    function appendTail(el,reply,isAI,searchResult,policyHits,workHits){

    // 简单Markdown处理：**加粗**

    reply=String(reply||'').replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>');

      var badgeMode='真实 AI 模式 · deepseek-v4-flash';

      if(searchResult) badgeMode='真实 AI + 联网搜索';

      else if(policyHits&&policyHits.length) badgeMode='真实 AI + 政策库检索';

      else if(workHits&&workHits.length) badgeMode='真实 AI + 作品库检索';

      var badge=isAI?'<div style="font-size:12px;color:#34d399;margin-top:6px;">'+badgeMode+' ✓</div>':'';

      if(!isAI) setState('#fbbf24','隐私保护模式');

      else if(searchResult) setState('#34d399','真实 AI + 联网');

      else setState('#34d399','真实 AI 模式');

      el.insertAdjacentHTML('beforeend',badge);

      // 回答涉及某作品 → 嵌入「查看这个作品 →」跳转按钮

      if(isAI){

        var jw=mapReplyToWork(String(reply||''));

        if(jw){

          el.insertAdjacentHTML('beforeend','<button class="jump-btn" data-work="'+jw.id+'">查看《'+escapeHtml(jw.name)+'》→</button>');

        }

      }

    }

    if(webEnabled){

      if(thinkEl) thinkEl.outerHTML='<span id="'+thinkId+'">🔍 正在联网搜索…（约2秒）</span>';

      window.SmartReconAI.webSearch(text,function(err,result){

        if(err||!result) askAI(null);

        else askAI(result);

      });

    } else {

      askAI(null);

    }

  }



  // 联网开关

  var webOn=true;

  var webBtn=document.getElementById('assistantWeb');

  if(webBtn){

    webBtn.classList.add('on');

    webBtn.addEventListener('click',function(){

      webOn=!webOn;

      webBtn.classList.toggle('on',webOn);

      webBtn.textContent=webOn?'🌐 联网':'🚫 离线';

    });

  }

  sendBtn.addEventListener('click',send);

  // 输入框：Enter 发送 / Shift+Enter 换行 / 自动增高

  input.addEventListener('keydown',function(e){

    if(e.key==='Enter'&&!e.shiftKey){

      e.preventDefault();

      send();

    }

  });

  input.addEventListener('input',function(){

    input.style.height='auto';

    input.style.height=Math.min(input.scrollHeight,96)+'px';

  });

  // 点击面板外部关闭设置弹层

  document.addEventListener('click',function(e){

    if(settings&&settings.classList.contains('open')&&!settings.contains(e.target)&&gear&&!gear.contains(e.target)){

      settings.classList.remove('open');

    }

  });

})();

// 模块级变量：防止快速切换作品时的setTimeout竞态

var _pendingWork = null;



function showWork(id){

  // 取消上一次未完成的延迟加载

  if(_pendingWork){ clearTimeout(_pendingWork); _pendingWork = null; }

  var tpl=document.getElementById('page-'+id);

  if(!tpl)return;

  // 加载反馈：避免弱网下"点了没反应"的错觉

  var wf=document.getElementById('workFrame');

  if(wf){ wf.style.display='block'; wf.style.opacity='0.35'; }

  var loadTip=document.getElementById('loadTip');

  if(!loadTip){

    loadTip=document.createElement('div');

    loadTip.id='loadTip';

    loadTip.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10000;background:rgba(14,19,34,0.92);color:#f1f3f9;border:1px solid rgba(130,150,255,0.4);border-radius:12px;padding:14px 22px;font-size:14px;box-shadow:0 10px 40px rgba(0,0,0,0.5);';

    loadTip.textContent='⏳ 正在加载作品…';

    document.body.appendChild(loadTip);

  } else { loadTip.style.display='block'; }

  setTimeout(function(){ if(loadTip) loadTip.style.display='none'; if(wf) wf.style.opacity='1'; }, 400);

  var appStyle=document.getElementById('app-style');

  var pageStyle=document.getElementById('page-style');

  var baseUrl=window.location.href.substring(0,window.location.href.lastIndexOf('/')+1);

  var styleHtml='<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><base href="'+baseUrl+'">';

  if(appStyle) styleHtml+='<style>'+appStyle.textContent+'</style>';

  if(pageStyle) styleHtml+='<style>'+pageStyle.textContent+'/* Mobile: moved to app-style for iframe injection */</style>';

  // echarts loaded via external script in iframe

  styleHtml+='<script src="'+baseUrl+'echarts.min.js"><\/script>';

  var aiEngine=document.getElementById('ai-engine');

  if(aiEngine) styleHtml+='<script>'+aiEngine.textContent.replace(/<\/script>/g,'<\\/script>')+'<\/script>';

  styleHtml+='<\/head><body style="margin:0;padding:0;" onload="window.scrollTo(0,0);">';

  var html=styleHtml+(tpl.textContent||tpl.innerHTML);

  html=html.replace(/<\\\/script>/g,'<\/script>');

  html+='<\/body><\/html>';

  // 先清空旧内容，再延迟设置新内容，避免新旧内容叠加

  var iframe = document.getElementById('workIframe');

  iframe.srcdoc = '';

  _pendingWork = setTimeout(function(){

    iframe.srcdoc = html;

    _pendingWork = null;

  }, 50);

  document.getElementById('workFrame').style.display='block';

  document.body.style.overflow='hidden';

  window.scrollTo(0,0);

}

function showHome(){

  // 取消未完成的作品加载

  if(_pendingWork){ clearTimeout(_pendingWork); _pendingWork = null; }

  // v3.9.2 显式释放 iframe 内 ECharts 实例（Gemini 建议：避免频繁切换时内存累积）

  try {

    var iw = document.getElementById('workIframe');

    if (iw && iw.contentWindow && iw.contentWindow.echarts) {

      var cw = iw.contentWindow;

      // 遍历 iframe 文档中所有 ECharts 容器，逐个 dispose

      if (cw.document && cw.document.querySelectorAll) {

        var containers = cw.document.querySelectorAll('.chart-echarts, [id^="chart"], [class*="proto2-chart"]');

        containers.forEach(function(el){

          try {

            var inst = cw.echarts.getInstanceByDom(el);

            if (inst) inst.dispose();

          } catch(e2) {}

        });

      }

    }

  } catch(e) {}

  document.getElementById('workFrame').style.display='none';

  document.getElementById('workIframe').srcdoc='';

  document.body.style.overflow='';

  var _ov=document.getElementById('workOverlay'); if(_ov)_ov.classList.remove('show');

}

function showHomeAndGo(id){

  showHome();

  setTimeout(function(){

    var el=document.getElementById(id);

    if(el) el.scrollIntoView({behavior:'smooth',block:'start'});

  }, 150);

}



/* ===== Global click delegation: support ALL browsers (incl. mobile) ===== */

(function(){

  function findWork(el){

    while(el && el !== document){

      if(el.getAttribute && el.getAttribute('data-work')) return el.getAttribute('data-work');

      var h = el.getAttribute ? el.getAttribute('href') : '';

      if(h && h.indexOf('showWork') > -1){

        var m = h.match(/showWork\('([^']+)'\)/);

        if(m) return m[1];

      }

      el = el.parentNode;

    }

    return null;

  }

  document.addEventListener('click', function(e){

    var id = findWork(e.target);

    if(id && typeof showWork === 'function'){

      e.preventDefault();

      showWork(id);

    }

  }, true);

})();

// ===== v5.0 UI交互增强 =====

(function(){

  var progress = document.getElementById('scrollProgress');

  var backBtn = document.getElementById('backToTop');

  var topbar = document.querySelector('.topbar');

  var overlay = document.getElementById('workOverlay');



  function onScroll(){

    var st = window.pageYOffset || document.documentElement.scrollTop;

    var dh = document.documentElement.scrollHeight - window.innerHeight;

    var pct = dh > 0 ? (st / dh) * 100 : 0;

    if(progress) progress.style.width = pct + '%';

    if(backBtn) backBtn.classList.toggle('show', st > 600);

    if(topbar) topbar.classList.toggle('scrolled', st > 50);

  }

  window.addEventListener('scroll', onScroll, {passive:true});

  onScroll();



  if(backBtn){

    backBtn.addEventListener('click', function(){

      window.scrollTo({top:0, behavior:'smooth'});

    });

  }



  function animateCount(el, target, duration){

    var startTime = null;

    var isK = target.toString().indexOf('K') > -1;

    var num = parseInt(target.toString().replace('K','')) * (isK ? 1000 : 1);

    function step(ts){

      if(!startTime) startTime = ts;

      var p = Math.min((ts - startTime) / duration, 1);

      var eased = 1 - Math.pow(1 - p, 3);

      var current = Math.floor(eased * num);

      if(isK){

        el.textContent = current >= 10000 ? '10K' : (current / 1000).toFixed(1) + 'K';

      } else {

        el.textContent = current;

      }

      if(p < 1) requestAnimationFrame(step);

      else el.textContent = target;

    }

    requestAnimationFrame(step);

  }



  var statsObserved = false;

  var statObserver = new IntersectionObserver(function(entries){

    entries.forEach(function(entry){

      if(entry.isIntersecting && !statsObserved){

        statsObserved = true;

        var statVs = document.querySelectorAll('.hero .stat .v');

        statVs.forEach(function(el, i){

          var target = el.textContent.trim();

          setTimeout(function(){ animateCount(el, target, 1200); }, i * 150);

        });

      }

    });

  }, {threshold: 0.3});

  var heroStats = document.querySelector('.hero .stats');

  if(heroStats) statObserver.observe(heroStats);



  if(overlay){

    overlay.addEventListener('click', function(){

      var wf = document.getElementById('workFrame');

      if(wf){ wf.style.display = 'none'; wf.style.opacity = '0'; }

      overlay.classList.remove('show');

      document.body.style.overflow = '';

    });

  }



  var origShowWork = window.showWork;

  if(origShowWork){

    window.showWork = function(id){

      origShowWork(id);

      if(overlay){

        setTimeout(function(){ overlay.classList.add('show'); }, 50);

      }

      document.body.style.overflow = 'hidden';

    };

  }



  document.addEventListener('keydown', function(e){

    if(e.key === 'Escape'){

      var wf = document.getElementById('workFrame');

      if(wf && wf.style.display === 'block'){

        wf.style.display = 'none'; wf.style.opacity = '0';

        if(overlay) overlay.classList.remove('show');

        document.body.style.overflow = '';

      }

    }

  });

})();

// 页面加载完成后自动同步知识库（从DOM提取最新作品信息）

if (document.readyState === 'loading') {

  document.addEventListener('DOMContentLoaded', function() {

    if (window.SmartReconAI && window.SmartReconAI.syncKBFromDOM) {

      window.SmartReconAI.syncKBFromDOM();

    }

  });

} else {

  if (window.SmartReconAI && window.SmartReconAI.syncKBFromDOM) {

    window.SmartReconAI.syncKBFromDOM();

  }

}



/* v7.1 导航激活态：按当前所在章节给 .nav 链接加 active + aria-current */

(function(){

  var links = Array.prototype.slice.call(document.querySelectorAll('#nav a[href^="#"]'));

  if (!links.length || !('IntersectionObserver' in window)) return;

  var sections = links.map(function(a){

    var id = a.getAttribute('href').slice(1);

    return document.getElementById(id);

  }).filter(function(el){ return !!el; });

  if (!sections.length) return;

  function setActive(id){

    links.forEach(function(a){

      var on = a.getAttribute('href') === '#' + id;

      if (on) { a.classList.add('active'); a.setAttribute('aria-current', 'location'); }

      else { a.classList.remove('active'); a.removeAttribute('aria-current'); }

    });

  }

  // v7.1 锚点偏移：顶栏是 sticky（含 padding），用实测占位写 CSS 变量，避免锚点被遮挡

  function syncNavOffset(){

    var tb = document.querySelector('.topbar');

    if (!tb) return;

    var h = tb.getBoundingClientRect().height + Math.max(0, tb.getBoundingClientRect().top);

    document.documentElement.style.setProperty('--nav-offset', Math.round(h) + 'px');

  }

  syncNavOffset();

  window.addEventListener('resize', syncNavOffset, { passive: true });

  window.addEventListener('load', syncNavOffset);

  var obs = new IntersectionObserver(function(entries){

    entries.forEach(function(en){

      if (en.isIntersecting) setActive(en.target.id);

    });

  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

  sections.forEach(function(sec){ obs.observe(sec); });

})();

(function(){var fab=document.getElementById('assistantFab');if(!fab)return;var lastY=window.scrollY||0;

window.addEventListener('scroll',function(){var y=window.scrollY||0;var nearBottom=(window.innerHeight+y)>=document.documentElement.scrollHeight*0.9;var down=y>lastY+6;

if(down&&nearBottom){fab.classList.add('is-tucked');}else if(y<=lastY-6){fab.classList.remove('is-tucked');}lastY=y;},{passive:true});})();

/* P2：关于我能力卡，桌面自动展开、手机默认收起 */
(function () {
  var d = document.querySelector('.about-fold');
  if (!d) return;
  var mq = window.matchMedia('(min-width: 769px)');
  var sync = function () { d.open = mq.matches; };
  sync();
  if (mq.addEventListener) mq.addEventListener('change', sync);
  else if (mq.addListener) mq.addListener(sync);
})();
