import { Preloader } from '@ui';
import { ResetPasswordUI } from '@ui-pages';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { selectUser } from '@services/selectors';
import { resetPassword } from '@services/slices';
import { useDispatch, useSelector } from '@services/store';

import type { SyntheticEvent } from 'react';

export const ResetPassword = (): React.JSX.Element => {
  const [canReset] = useState(() => !!localStorage.getItem('resetPassword'));
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const { loading, error } = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = (event: SyntheticEvent): void => {
    event.preventDefault();

    if (!loading)
      void dispatch(resetPassword({ password, token }))
        .unwrap()
        .then(() => navigate('/login', { replace: true }))
        .catch(() => undefined);
  };

  if (loading) return <Preloader />;

  if (!canReset) return <Navigate to="/forgot-password" replace />;

  return (
    <ResetPasswordUI
      errorText={error ?? undefined}
      password={password}
      token={token}
      setPassword={setPassword}
      setToken={setToken}
      handleSubmit={handleSubmit}
    />
  );
};
