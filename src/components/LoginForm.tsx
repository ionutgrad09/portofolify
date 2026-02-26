import React, {useState, FormEvent} from "react";

interface LoginFormProps {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit }) => {
  const [pin, setPin] = useState<string>('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl w-full max-w-sm">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Introduce PIN-ul</h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <input
            name="password"
            type="password"
            value={pin}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPin(e.target.value)}
            placeholder="PIN"
            className="w-full px-4 py-3 rounded-xl bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3 rounded-xl font-semibold shadow-lg">
            Accesează
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
