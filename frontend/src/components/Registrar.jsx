import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Layers } from 'lucide-react';
import ModalCadastroSucesso from './ModalCadastroSucesso';

/**
 * Componente de Registro de Usuário
 * Tela para criação de nova conta no sistema
 */

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    nomeLoja: '',
    cnpj: '',
    telefone: '',
    endereco: '',
    responsavel: '',
    plano: '' // removido do formulário, mas mantido no estado para compatibilidade futura
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showModal, setShowModal] = useState(false);


  // Máscara para CNPJ
  const formatCNPJ = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
      .slice(0, 18);
  };

  // Máscara para telefone
  const formatPhone = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === 'cnpj') formattedValue = formatCNPJ(value);
    if (name === 'telefone') formattedValue = formatPhone(value);
    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
    // Limpar erro do campo ao digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nomeLoja.trim()) {
      newErrors.nomeLoja = 'Nome da loja é obrigatório';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Nome completo é obrigatório';
    }
    if (!formData.cnpj.trim()) {
      newErrors.cnpj = 'CNPJ é obrigatório';
    } else if (!/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(formData.cnpj)) {
      newErrors.cnpj = 'CNPJ inválido (formato: 00.000.000/0000-00)';
    }
    if (!formData.telefone.trim()) {
      newErrors.telefone = 'Telefone é obrigatório';
    } else if (!/^\(\d{2}\) \d{5}-\d{4}$/.test(formData.telefone)) {
      newErrors.telefone = 'Telefone inválido (formato: (99) 99999-9999)';
    }
    if (!formData.endereco.trim()) {
      newErrors.endereco = 'Endereço é obrigatório';
    }
    if (!formData.responsavel.trim()) {
      newErrors.responsavel = 'Responsável é obrigatório';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSuccessMessage('');

    try {
      console.log('📤 Criando conta:', { name: formData.name, email: formData.email });

      const response = await fetch('http://localhost:3001/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nomeLoja: formData.nomeLoja,
          email: formData.email,
          senha: formData.password,
          cnpj: formData.cnpj,
          telefone: formData.telefone,
          endereco: formData.endereco,
          responsavel: formData.responsavel
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Conta criada com sucesso:', data);

        // Limpar formulário
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          nomeLoja: '',
          cnpj: '',
          telefone: '',
          endereco: '',
          responsavel: '',
          plano: ''
        });

        setShowModal(true);
      } else {
        setErrors({ general: data.error || 'Erro ao criar conta' });
      }

    } catch (err) {
      console.error('❌ Erro ao criar conta:', err);
      setErrors({ general: 'Erro ao conectar com o servidor. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ModalCadastroSucesso open={showModal} onClose={() => navigate('/login')} />
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background-light dark:bg-background-dark px-4 py-8">
        <div className="w-full max-w-md">
          
          {/* Header */}
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="mb-4 p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <Layers className="text-primary dark:text-primary" size={32} />
            </div>
            <h1 className="text-[#111318] dark:text-white text-3xl font-bold tracking-tight">
              Crie sua Conta
            </h1>
            <p className="text-[#616f89] dark:text-gray-400 mt-2 text-base text-center">
              Preencha os campos abaixo para começar.
            </p>
          </div>

          {/* Success Message */}
          {/* Mensagem agora é exibida via modal, não mais na tela */}

          {/* General Error */}
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* Nome da Loja */}
            <label className="flex flex-col">
              <p className="text-[#111318] dark:text-gray-300 text-base font-medium leading-normal pb-2">
                Nome da Loja
              </p>
              <input
                className={`w-full rounded-lg border ${errors.nomeLoja ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-background-dark/50 focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary h-14 px-4 text-base text-[#111318] dark:text-white placeholder:text-[#616f89] dark:placeholder:text-gray-400 transition-colors`}
                name="nomeLoja"
                placeholder="Digite o nome da loja"
                type="text"
                value={formData.nomeLoja}
                onChange={handleChange}
              />
              {errors.nomeLoja && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.nomeLoja}</p>
              )}
            </label>

            {/* Nome Completo */}
            <label className="flex flex-col">
              <p className="text-[#111318] dark:text-gray-300 text-base font-medium leading-normal pb-2">
                Nome Completo
              </p>
              <div className="relative flex w-full items-center">
                <User className="absolute left-3.5 text-[#616f89] dark:text-gray-400" size={20} />
                <input
                  className={`w-full rounded-lg border ${errors.name ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-background-dark/50 focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary h-14 pl-11 pr-4 text-base text-[#111318] dark:text-white placeholder:text-[#616f89] dark:placeholder:text-gray-400 transition-colors`}
                  name="name"
                  placeholder="Digite seu nome completo"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              {errors.name && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.name}</p>
              )}
            </label>

            {/* CNPJ */}
            <label className="flex flex-col">
              <p className="text-[#111318] dark:text-gray-300 text-base font-medium leading-normal pb-2">
                CNPJ
              </p>
              <input
                className={`w-full rounded-lg border ${errors.cnpj ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-background-dark/50 focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary h-14 px-4 text-base text-[#111318] dark:text-white placeholder:text-[#616f89] dark:placeholder:text-gray-400 transition-colors`}
                name="cnpj"
                placeholder="Digite o CNPJ da loja"
                type="text"
                value={formData.cnpj}
                onChange={handleChange}
              />
              {errors.cnpj && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.cnpj}</p>
              )}
            </label>

            {/* Telefone */}
            <label className="flex flex-col">
              <p className="text-[#111318] dark:text-gray-300 text-base font-medium leading-normal pb-2">
                Telefone
              </p>
              <input
                className={`w-full rounded-lg border ${errors.telefone ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-background-dark/50 focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary h-14 px-4 text-base text-[#111318] dark:text-white placeholder:text-[#616f89] dark:placeholder:text-gray-400 transition-colors`}
                name="telefone"
                placeholder="Digite o telefone da loja"
                type="text"
                value={formData.telefone}
                onChange={handleChange}
              />
              {errors.telefone && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.telefone}</p>
              )}
            </label>

            {/* Endereço */}
            <label className="flex flex-col">
              <p className="text-[#111318] dark:text-gray-300 text-base font-medium leading-normal pb-2">
                Endereço
              </p>
              <input
                className={`w-full rounded-lg border ${errors.endereco ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-background-dark/50 focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary h-14 px-4 text-base text-[#111318] dark:text-white placeholder:text-[#616f89] dark:placeholder:text-gray-400 transition-colors`}
                name="endereco"
                placeholder="Digite o endereço da loja"
                type="text"
                value={formData.endereco}
                onChange={handleChange}
              />
              {errors.endereco && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.endereco}</p>
              )}
            </label>

            {/* Responsável */}
            <label className="flex flex-col">
              <p className="text-[#111318] dark:text-gray-300 text-base font-medium leading-normal pb-2">
                Responsável
              </p>
              <input
                className={`w-full rounded-lg border ${errors.responsavel ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-background-dark/50 focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary h-14 px-4 text-base text-[#111318] dark:text-white placeholder:text-[#616f89] dark:placeholder:text-gray-400 transition-colors`}
                name="responsavel"
                placeholder="Nome do responsável pela loja"
                type="text"
                value={formData.responsavel}
                onChange={handleChange}
              />
              {errors.responsavel && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.responsavel}</p>
              )}
            </label>



            {/* E-mail */}
            <label className="flex flex-col">
              <p className="text-[#111318] dark:text-gray-300 text-base font-medium leading-normal pb-2">
                E-mail
              </p>
              <div className="relative flex w-full items-center">
                <Mail className="absolute left-3.5 text-[#616f89] dark:text-gray-400" size={20} />
                <input
                  className={`w-full rounded-lg border ${errors.email ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-background-dark/50 focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary h-14 pl-11 pr-4 text-base text-[#111318] dark:text-white placeholder:text-[#616f89] dark:placeholder:text-gray-400 transition-colors`}
                  name="email"
                  placeholder="seuemail@exemplo.com"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              {errors.email && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </label>

            {/* Senha */}
            <label className="flex flex-col">
              <p className="text-[#111318] dark:text-gray-300 text-base font-medium leading-normal pb-2">
                Senha
              </p>
              <div className="relative flex w-full items-center">
                <Lock className="absolute left-3.5 text-[#616f89] dark:text-gray-400" size={20} />
                <input
                  className={`w-full rounded-lg border ${errors.password ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-background-dark/50 focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary h-14 pl-11 pr-12 text-base text-[#111318] dark:text-white placeholder:text-[#616f89] dark:placeholder:text-gray-400 transition-colors`}
                  name="password"
                  placeholder="Crie uma senha forte"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#616f89] dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 absolute right-3.5 transition-colors"
                  aria-label="Mostrar senha"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.password}</p>
              )}
            </label>

            {/* Confirmação de Senha */}
            <label className="flex flex-col">
              <p className="text-[#111318] dark:text-gray-300 text-base font-medium leading-normal pb-2">
                Confirmação de Senha
              </p>
              <div className="relative flex w-full items-center">
                <Lock className="absolute left-3.5 text-[#616f89] dark:text-gray-400" size={20} />
                <input
                  className={`w-full rounded-lg border ${errors.confirmPassword ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-background-dark/50 focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary h-14 pl-11 pr-12 text-base text-[#111318] dark:text-white placeholder:text-[#616f89] dark:placeholder:text-gray-400 transition-colors`}
                  name="confirmPassword"
                  placeholder="Confirme sua senha"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-[#616f89] dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 absolute right-3.5 transition-colors"
                  aria-label="Mostrar senha"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Criando conta...</span>
                </>
              ) : (
                'Criar Conta'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[#616f89] dark:text-gray-400">
              Já tem uma conta?{' '}
              <a 
                className="font-semibold text-primary dark:text-primary hover:underline transition-colors cursor-pointer" 
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/login');
                }}
              >
                Faça Login
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
