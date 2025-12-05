
import React, { useState } from 'react';
import { User as UserIcon, Lock, AlertCircle } from 'lucide-react';
import { User } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, loading, setLoading }) => {
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!loginInput.trim() || !passwordInput.trim()) {
      setError('Preencha login e senha!');
      return;
    }

    setLoading(true);

    try {
      // 1. Gera um Token de Sessão Único
      const sessionToken = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);

      // Helper para data SQL
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const dataHrEnvio = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

      // 2. Consulta o Webhook (n8n)
      const WEBHOOK_URL = "https://projeto-teste-n8n.ly7t0m.easypanel.host/webhook/Validar_Credenciais";
      
      const payload = {
        usuario: loginInput.trim(),
        senha: passwordInput.trim(),
        action: "validar credencial",
        status: "request_access",
        session_token: sessionToken, // Envia para o n8n atualizar o banco
        timestamp: new Date().toISOString(),
        "Data/hr do envio": dataHrEnvio
      };

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // 3. Processa a resposta
      const responseText = await response.text();
      let webhookResult;
      
      try {
        const jsonResponse = JSON.parse(responseText);
        // Se retornar array, pega o primeiro item
        webhookResult = Array.isArray(jsonResponse) ? jsonResponse[0] : jsonResponse;
      } catch (e) {
        console.error("Erro parse JSON:", responseText);
        // Tenta contornar erros de HTML retornados
        throw new Error("Erro de comunicação com o servidor. Tente novamente.");
      }

      if (!response.ok) {
         throw new Error("Credenciais inválidas ou erro no servidor.");
      }

      // 4. Verifica se recebemos dados válidos do usuário
      const hasUserData = webhookResult && webhookResult.id && webhookResult.Nome_Completo;
      
      if (!hasUserData) {
        // Se o servidor retornou "online" mas NÃO mandou os dados, bloqueamos.
        // MAS, se o servidor atualizou o token lá no banco e retornou os dados, deixamos passar (para derrubar o outro).
        const actionStatus = (webhookResult?.Action || webhookResult?.action || "").toString().toLowerCase();
        if (actionStatus === "online") {
           throw new Error("Usuário já está conectado e o servidor não liberou novo acesso.");
        }
        throw new Error("Usuário ou senha incorretos.");
      }

      // 5. Monta o objeto de usuário usando as colunas CORRETAS do banco (sesson_id)
      const authenticatedUser: User = {
        id: webhookResult.id,
        Usuario: webhookResult.Usuario || loginInput,
        Nome_Completo: webhookResult.Nome_Completo,
        Senha: passwordInput,
        
        // ********************************************************************************
        // 🚨 CRITICAL: MAPEAMENTO DE SESSÃO 🚨
        // 'sesson_id' é o nome exato da coluna no banco. NÃO ALTERAR.
        // Isso garante o funcionamento do logout remoto.
        // ********************************************************************************
        sesson_id: sessionToken, 
        
        "Session_Data/HR": dataHrEnvio
      };

      onLoginSuccess(authenticatedUser);

    } catch (err: any) {
      console.error("Erro no login:", err);
      setError(err.message || 'Falha ao realizar login.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-br from-[#690c76] via-[#460069] to-[#2c0040] flex items-center justify-center z-[9999] overflow-hidden">
      {/* Background Shapes */}
      <div className="bg-shapes absolute w-full h-full overflow-hidden opacity-20 pointer-events-none">
        <div className="shape w-[100px] h-[100px] top-[15%] left-[10%] animate-float-novo" />
        <div className="shape w-[60px] h-[60px] top-[60%] left-[5%] animate-float-novo-rev" />
        <div className="shape w-[80px] h-[80px] top-[30%] left-[85%] animate-float-novo" />
        <div className="shape w-[120px] h-[120px] top-[45%] right-[25%] animate-float-novo" />
      </div>

      <div className="login-container-novo flex w-[90%] max-w-[1000px] min-h-[500px] bg-white rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden relative z-10 animate-slideIn-novo flex-col md:flex-row">
        
        {/* Left Side */}
        <div className="welcome-side-novo flex-1 bg-gradient-to-br from-[#690c76] to-[#4d0557] p-[40px_30px] md:p-[60px_50px] flex flex-col justify-center text-white relative overflow-hidden">
          <div className="welcome-content-novo relative z-10">
            <h1 className="text-[24px] md:text-[28px] font-bold mb-[30px] leading-[1.4]">SMO - Sistema de Manifesto Operacional</h1>
          </div>
        </div>

        {/* Right Side */}
        <div className="form-side-novo flex-1 p-[40px_30px] md:p-[60px_50px] flex flex-col justify-center bg-white relative">
          
          <div className="form-content-novo mt-8 md:mt-0">
            <h2 className="text-[24px] md:text-[32px] font-bold text-[#333] mb-[40px]">Entrar</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group-novo mb-[20px] relative">
                <div className="absolute left-[16px] top-1/2 -translate-y-1/2 text-lg text-gray-500"><UserIcon size={18} /></div>
                <input 
                  type="text" 
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  placeholder="Usuário" 
                  autoComplete="username"
                  name="usuario_sistema_login"
                  className="w-full p-[14px_16px_14px_45px] border-2 border-[#e8e8e8] rounded-[12px] text-[15px] bg-[#f8f9fa] focus:outline-none focus:border-[#690c76] transition-all"
                  disabled={loading}
                />
              </div>
              <div className="form-group-novo mb-[20px] relative">
                <div className="absolute left-[16px] top-1/2 -translate-y-1/2 text-lg text-gray-500"><Lock size={18} /></div>
                <input 
                  type="password" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Senha" 
                  autoComplete="current-password"
                  name="senha_sistema_login"
                  className="w-full p-[14px_16px_14px_45px] border-2 border-[#e8e8e8] rounded-[12px] text-[15px] bg-[#f8f9fa] focus:outline-none focus:border-[#690c76] transition-all"
                  disabled={loading}
                />
              </div>
              <button 
                type="submit" 
                className="w-full p-[14px] bg-gradient-to-br from-[#690c76] to-[#4d0557] text-white border-none rounded-[12px] text-[16px] font-semibold cursor-pointer shadow-[0_4px_15px_rgba(105,12,118,0.3)] hover:-translate-y-[1px] disabled:opacity-60 transition-all"
                disabled={loading}
              >
                {loading ? 'Verificando Credenciais...' : 'Entrar'}
              </button>
            </form>
            
            {error && (
              <div className="mt-[20px] p-[12px] bg-red-50 border border-red-200 rounded-[8px] flex items-start gap-3 animate-fadeInScale shadow-sm">
                <AlertCircle size={18} className="text-red-600 mt-[1px] shrink-0" />
                <span className="text-[13px] text-red-700 font-medium leading-snug text-left">
                  {error}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
