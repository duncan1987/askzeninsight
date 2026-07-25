/**
 * Sensitive keywords related to self-harm, suicide, depression, and mental health crises
 * When these keywords are detected in user messages, the system will redirect
 * to professional help resources instead of providing AI guidance.
 */

export const SENSITIVE_KEYWORDS = [
  // Self-harm and suicide (Chinese)
  '自杀',
  '想死',
  '不想活了',
  '想结束',
  '死了算了',
  '结束生命',
  '离开这个世界',
  '自我伤害',
  '自残',
  '割腕',
  '跳楼',
  '跳河',
  '上吊',

  // Depression and mental health (Chinese)
  '抑郁',
  '抑郁症',
  '重度抑郁',
  '严重抑郁',
  '想不开',
  '绝望',
  '崩溃',
  '精神崩溃',
  '心理崩溃',
  '撑不住了',
  '活不下去了',
  '没希望',
  '没前途',
  '一切都没意义',
  '活着没意思',
  '解脱',
  '想解脱',

  // Self-harm and suicide (English)
  'suicide',
  'kill myself',
  'want to die',
  'want to end it',
  'end my life',
  'self harm',
  'self-harm',
  'self harm',
  'self-injury',
  'cut myself',
  'cutting',
  'jump off',
  'hang myself',

  // Depression and mental health (English)
  'depressed',
  'depression',
  'severe depression',
  'major depression',
  'hopeless',
  'hopelessness',
  'desperate',
  'desperation',
  'mental breakdown',
  'breakdown',
  'can\'t take it anymore',
  'can\'t go on',
  'no point',
  'no purpose',
  'meaningless',
  'end the pain',
  'want relief',
]

/**
 * Check if message contains sensitive keywords
 */
export function containsSensitiveKeywords(message: string): boolean {
  const lowerMessage = message.toLowerCase()
  return SENSITIVE_KEYWORDS.some(keyword =>
    lowerMessage.includes(keyword.toLowerCase())
  )
}

/**
 * Get crisis resources message
 */
export function getCrisisResourcesMessage(locale?: string): string {
  if (locale === 'zh') {
    return `我注意到你正在经历一段非常困难的时期。本 AI 心灵指引服务无法处理心理健康危机或紧急情况。

如果你正在经历自伤或自杀的念头，请立即寻求帮助：

🆘 紧急服务：
- 紧急电话：110（中国）/ 911（美国）/ 112（欧盟）
- 全国24小时心理危机干预热线：400-161-9995
- 北京心理危机研究与干预中心：010-82951332
- 生命热线：400-821-1215

🌟 专业帮助：
- 寻找附近的心理咨询师
- 联系你所在地区的心理健康热线
- 前往医院急诊科

💙 支持资源：
- 与信任的朋友、家人或灵性导师交谈
- 联系你的医生或医疗保健提供者

你不是一个人，帮助就在身边。请向专业人士寻求支持。

关心你的安危。`
  }

  return `I notice you may be going through a very difficult time. This AI spiritual guidance service is not equipped to handle mental health crises or emergency situations.

If you are experiencing thoughts of self-harm or suicide, please reach out for help immediately:

🆘 Emergency Services:
- Emergency: 911 (US) / 999 (UK) / 112 (EU)
- Suicide & Crisis Lifeline: 988 (US)

🌟 Professional Help:
- Find a therapist or counselor near you
- Contact a mental health hotline in your country
- Visit an emergency room or urgent care

💙 Support Resources:
- Talk to a trusted friend, family member, or spiritual leader
- Contact your doctor or healthcare provider

You are not alone, and help is available. Please reach out to a qualified professional who can provide the support you need during this difficult time.

With care and concern for your wellbeing.`
}
