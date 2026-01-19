
import React, { useState } from 'react';
import { User as UserIcon, Lock, AlertCircle, Info, Terminal, ShieldCheck, Activity } from 'lucide-react';
import { User } from '../types';
import { supabase } from '../supabaseClient';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, loading, setLoading }) => {
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState<{msg: string, type: 'error' | 'info'}>({ msg: '', type: 'error' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError({ msg: '', type: 'error' });
    
    if (!loginInput.trim() || !passwordInput.trim()) {
      setError({ msg: 'Credenciais incompletas.', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      const { data: userFound, error: dbError } = await supabase
        .from('Cadastro_de_Perfil')
        .select('*')
        .eq('Usuario', loginInput.trim())
        .eq('Senha', passwordInput.trim())
        .single();

      if (dbError || !userFound) {
        throw new Error("Acesso negado. Credenciais inválidas.");
      }

      const sessionToken = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
      const now = new Date();
      const dataHrEnvio = now.toLocaleString('pt-BR');

      const { error: updateError } = await supabase
        .from('Cadastro_de_Perfil')
        .update({
          sesson_id: sessionToken,
          "Session_Data/HR": dataHrEnvio
        })
        .eq('id', userFound.id);

      if (updateError) throw updateError;
      
      const authenticatedUser: User = {
        id: userFound.id,
        Usuario: userFound.Usuario,
        Nome_Completo: userFound.Nome_Completo || "Operador",
        Senha: passwordInput,
        sesson_id: sessionToken, 
        "Session_Data/HR": dataHrEnvio
      };

      onLoginSuccess(authenticatedUser);

    } catch (err: any) {
      console.error("Login Failure:", err);
      setError({ msg: err.message || 'Erro de comunicação com o servidor.', type: 'error' });
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0f172a] flex items-center justify-center z-[9999] overflow-hidden">
      {/* Background Technical Grid */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 0)', backgroundSize: '40px 40px' }}>
      </div>

      <div className="w-full max-w-[900px] flex flex-col md:flex-row bg-white border-2 border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-fadeIn overflow-hidden">
        
        {/* Lado Esquerdo: Identidade Industrial */}
        <div className="flex-1 bg-slate-900 p-10 flex flex-col justify-between relative border-r-2 border-slate-800">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-indigo-600">
                <Terminal size={24} className="text-white" />
              </div>
              <h1 className="text-xl font-black text-white tracking-[0.2em] uppercase">SMO <span className="text-indigo-400 font-normal">v2.5</span></h1>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white leading-tight uppercase tracking-tight">Sistema de Manifesto Operacional</h2>
              <div className="h-1 w-12 bg-indigo-500" />
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed opacity-60">
                Acesso restrito ao terminal de logística. <br/> Auditoria em tempo real habilitada.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-4 text-slate-500">
             <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-indigo-500" />
                <span className="text-[9px] font-black uppercase tracking-widest">Encrypted Auth</span>
             </div>
             <div className="flex items-center gap-2">
                <Activity size={14} className="text-emerald-500" />
                <span className="text-[9px] font-black uppercase tracking-widest">Network Stable</span>
             </div>
          </div>

          {/* Abstract Design Element */}
          <div className="absolute bottom-[-10%] right-[-10%] opacity-[0.02] text-white">
            <Terminal size={400} />
          </div>
        </div>

        {/* Lado Direito: Formulário Técnico */}
        <div className="flex-1 p-10 md:p-16 flex flex-col justify-center bg-white">
          <div className="mb-10">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Identificação de Operador</h3>
            <h2 className="text-2xl font-black text-slate-900 uppercase">Login de Acesso</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">ID de Usuário</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <UserIcon size={16} />
                </div>
                <input 
                  type="text" 
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  placeholder="DIGITE SEU ID" 
                  className="w-full h-12 pl-10 pr-4 bg-slate-50 border-2 border-slate-200 text-xs font-bold uppercase tracking-widest outline-none focus:border-indigo-600 focus:bg-white transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Código de Segurança</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={16} />
                </div>
                <input 
                  type="password" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full h-12 pl-10 pr-4 bg-slate-50 border-2 border-slate-200 text-xs font-bold outline-none focus:border-indigo-600 focus:bg-white transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full h-12 bg-slate-900 hover:bg-indigo-700 text-white border-none text-[11px] font-black uppercase tracking-[0.2em] cursor-pointer transition-all shadow-lg hover:shadow-indigo-200 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white animate-spin"></div>
              ) : (
                'Autenticar no Sistema'
              )}
            </button>
          </form>

          {error.msg && (
            <div className={`mt-6 p-4 border-l-4 flex items-start gap-3 animate-fadeIn ${
                error.type === 'error' ? 'bg-red-50 border-red-600 text-red-700' : 'bg-blue-50 border-blue-600 text-blue-700'
            }`}>
              {error.type === 'error' ? <AlertCircle size={18} className="shrink-0" /> : <Info size={18} className="shrink-0" />}
              <span className="text-[11px] font-black uppercase tracking-tight leading-tight">
                {error.msg}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
