import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function DebugPanel() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runDiagnostics = async () => {
      const info: any = {
        envVars: {
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
          supabaseDatabaseUrl: import.meta.env.VITE_SUPABASE_DATABASE_URL,
          supabaseAnonKeyExists: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
          allSupabaseVars: Object.keys(import.meta.env).filter(key => key.includes('SUPABASE'))
        },
        tests: {}
      };

      // Test 1: Basic connection
      try {
        const { data, error } = await supabase.from('categories').select('count', { count: 'exact', head: true });
        info.tests.basicConnection = { success: !error, error: error?.message, count: data };
      } catch (err) {
        info.tests.basicConnection = { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
      }

      // Test 2: Try to fetch one category
      try {
        const { data, error } = await supabase.from('categories').select('*').limit(1);
        info.tests.fetchCategory = { success: !error, error: error?.message, data };
      } catch (err) {
        info.tests.fetchCategory = { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
      }

      // Test 3: Check auth status
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        info.tests.authStatus = { success: !error, error: error?.message, hasSession: !!session };
      } catch (err) {
        info.tests.authStatus = { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
      }

      setDebugInfo(info);
      setLoading(false);
    };

    runDiagnostics();
  }, []);

  if (loading) {
    return <div className="p-4 bg-blue-50 border border-blue-200 rounded">Running diagnostics...</div>;
  }

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <h3 className="text-lg font-bold mb-4">Supabase Debug Information</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-green-700">Environment Variables:</h4>
          <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
            {JSON.stringify(debugInfo.envVars, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="font-semibold text-blue-700">Connection Tests:</h4>
          <div className="space-y-2">
            {Object.entries(debugInfo.tests || {}).map(([testName, result]: [string, any]) => (
              <div key={testName} className={`p-2 rounded ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
                <div className="font-medium">{testName}: {result.success ? '✅ Success' : '❌ Failed'}</div>
                {result.error && <div className="text-sm text-red-600">Error: {result.error}</div>}
                {result.data && <div className="text-xs text-gray-600">Data: {JSON.stringify(result.data)}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}