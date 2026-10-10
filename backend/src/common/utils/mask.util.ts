// 로그에 남기는 PII를 가리는 순수 함수 모음

/**
 * 이메일의 로컬 파트를 앞 2자리만 남기고 가린다.
 * `hong@a.com` → `ho***@a.com`. null·빈 문자열은 빈 문자열, `@` 없는 값은 도메인 없이 처리한다.
 */
export function maskEmail(email: string | null): string {
  if (!email) return '';

  const at = email.indexOf('@');
  const local = at < 0 ? email : email.slice(0, at);
  const domain = at < 0 ? '' : email.slice(at);

  return `${local.slice(0, 2)}***${domain}`;
}

/**
 * 이름의 첫 글자와 끝 글자만 남기고 가린다.
 * `홍길동` → `홍*동`, `홍길` → `홍*`, `홍` → `*`. null·빈 문자열은 빈 문자열을 반환한다.
 */
export function maskName(name: string | null): string {
  if (!name) return '';

  // 서로게이트 페어(이모지 등)가 잘려 깨지지 않도록 코드 포인트 단위로 자른다
  const chars = [...name];
  if (chars.length === 1) return '*';
  if (chars.length === 2) return `${chars[0]}*`;

  return `${chars[0]}${'*'.repeat(chars.length - 2)}${chars[chars.length - 1]}`;
}
