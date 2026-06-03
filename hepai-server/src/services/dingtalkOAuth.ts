/**
 * 钉钉企业内部应用 · auth_code 换 userid（试点 / 正式上线）
 * 未配置 AppKey/AppSecret 时返回 null，由开发 auth_code 兜底。
 */

async function getAppAccessToken(): Promise<string | null> {
  const appKey = process.env.DINGTALK_APP_KEY?.trim();
  const appSecret = process.env.DINGTALK_APP_SECRET?.trim();
  if (!appKey || !appSecret) return null;

  const res = await fetch('https://api.dingtalk.com/v1.0/oauth2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appKey, appSecret }),
  });
  if (!res.ok) {
    console.warn('[dingtalk] accessToken failed', res.status, await res.text());
    return null;
  }
  const data = (await res.json()) as {
    accessToken?: string;
    expireIn?: number;
  };
  return data.accessToken ?? null;
}

/** 将 JSAPI auth_code 解析为钉钉 userid */
export async function resolveDingtalkUserId(
  authCode: string,
): Promise<string | null> {
  const token = await getAppAccessToken();
  if (!token) return null;

  const url = `https://oapi.dingtalk.com/topapi/v2/user/getuserinfo?access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: authCode }),
  });
  if (!res.ok) {
    console.warn('[dingtalk] getuserinfo failed', res.status, await res.text());
    return null;
  }
  const data = (await res.json()) as {
    errcode?: number;
    result?: { userid?: string };
  };
  if (data.errcode !== 0 || !data.result?.userid) {
    console.warn('[dingtalk] getuserinfo err', data);
    return null;
  }
  return data.result.userid;
}

export function dingtalkPilotConfigured(): boolean {
  return Boolean(
    process.env.DINGTALK_APP_KEY?.trim() &&
      process.env.DINGTALK_APP_SECRET?.trim(),
  );
}

export function dingtalkPilotPublicConfig() {
  return {
    oauth_configured: dingtalkPilotConfigured(),
    corp_id: process.env.DINGTALK_CORP_ID?.trim() ?? null,
    agent_id: process.env.DINGTALK_AGENT_ID?.trim() ?? null,
  };
}
