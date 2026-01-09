// app/dashboard/agent-actions/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type AgentAction = {
  id: string;
  action_type: string;
  user_identifier: string | null;
  xec_amount: number;
  status: string;
  tx_hash: string | null;
  meta: any | null;
  created_at: string;
};

export default function AgentActionsPage() {
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    const { data } = await supabase
      .from('agent_actions')
      .select('*')
      .order('created_at', { ascending: false });
    setActions(data || []);
    setLoading(false);
  };

  const handleRetry = async (id: string) => {
    if (confirm('Retry sending XEC for this action?')) {
      const res = await fetch('/api/reward-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_id: id }),
      });
      if (res.ok) {
        alert('Reward sent!');
        fetchActions();
      } else {
        alert('Failed to send reward.');
      }
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Agent Actions</h1>
      {loading ? (
        <p className="text-gray-400">Loading actions...</p>
      ) : actions.length === 0 ? (
        <p className="text-gray-500">No agent actions yet.</p>
      ) : (
        <div className="space-y-4">
          {actions.map((action) => (
            <div key={action.id} className="bg-gray-900 p-4 rounded-xl">
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <p className="font-medium">
                    {action.action_type.replace('_', ' ')} → {action.xec_amount} XEC
                  </p>
                  <p className="text-gray-400 text-sm">
                    User: {action.user_identifier || '—'}
                  </p>
                  {action.metadata?.tweet_id && (
                    <a
                      href={`https://twitter.com/user/status/${action.metadata.tweet_id}`}
                      target="_blank"
                      rel="noopener"
                      className="text-turquoise text-sm hover:underline"
                    >
                      View Tweet
                    </a>
                  )}
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs ${
                      action.status === 'sent'
                        ? 'bg-green-900/30 text-green-400'
                        : action.status === 'failed'
                        ? 'bg-red-900/30 text-red-400'
                        : 'bg-yellow-900/30 text-yellow-400'
                    }`}
                  >
                    {action.status}
                  </span>
                  <p className="text-sm text-gray-400 mt-1">
                    {new Date(action.created_at).toLocaleString()}
                  </p>
                  {action.tx_hash && (
                    <a
                      href={`https://xrpscan.com/tx/${action.tx_hash}`}
                      target="_blank"
                      rel="noopener"
                      className="text-turquoise text-xs hover:underline"
                    >
                      View TX
                    </a>
                  )}
                </div>
              </div>
              {action.status === 'failed' && (
                <button
                  onClick={() => handleRetry(action.id)}
                  className="mt-3 text-sm bg-turquoise text-black py-1 px-3 rounded"
                >
                  Retry Reward
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
