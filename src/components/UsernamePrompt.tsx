import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, RotateCcw } from 'lucide-react';
import { ApiService } from '../services/api';

export const UsernamePrompt: React.FC = () => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError('Username can only contain letters, numbers, hyphens, and underscores');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await ApiService.checkUsername(username);
      
      if (response.success && response.data?.available) {
        navigate(`/workspace/${username}`);
      } else {
        setError('Username is already in use');
      }
    } catch (err) {
      setError('Failed to check username availability');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center p-4">
      <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-[#007acc] p-3 rounded-lg">
            <User className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h1 className="text-2xl font-semibold text-[#cccccc] text-center mb-2">
          Welcome to Kit Playground
        </h1>
        <p className="text-[#969696] text-center mb-8">
          Choose your unique username to get started
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-[#cccccc] mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-[#3c3c3c] border border-[#464647] rounded-md text-[#cccccc] placeholder-[#969696] focus:ring-2 focus:ring-[#007acc] focus:border-transparent transition-all duration-200"
              placeholder="Enter your username"
              disabled={loading}
            />
            {error && (
              <p className="mt-2 text-sm text-[#f14c4c]">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full bg-[#007acc] hover:bg-[#005a9e] disabled:bg-[#464647] disabled:text-[#969696] text-white font-medium py-2 px-4 rounded-md transition-all duration-200 flex items-center justify-center"
          >
            {loading ? (
              <>
                <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                Checking availability...
              </>
            ) : (
              'Continue'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#3c3c3c]">
          <p className="text-xs text-[#969696] text-center">
            Your workspace will be created at /{username || 'username'}
          </p>
        </div>
      </div>
    </div>
  );
};