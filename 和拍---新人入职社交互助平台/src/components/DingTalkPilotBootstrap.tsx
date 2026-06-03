/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 钉钉试点：尝试免登，失败则展示原有工号登录
 */

import React, { useEffect, useState } from 'react';
import { tryDingTalkSilentLogin } from '../utils/dingtalkRuntime';

export default function DingTalkPilotBootstrap({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await tryDingTalkSilentLogin();
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f6f8] text-sm text-[#646a73] font-sans">
        正在接入钉钉…
      </div>
    );
  }

  return <>{children}</>;
}
