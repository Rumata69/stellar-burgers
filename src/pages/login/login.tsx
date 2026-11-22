import { Preloader } from '@ui';
import { LoginUI } from '@ui-pages';
import { useState } from 'react';

import { selectUser } from '@services/selectors';
import { login } from '@services/slices';
import { useDispatch, useSelector } from '@services/store';

import type { SyntheticEvent } from 'react';

export const Login = (): React.JSX.Element => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const { error, loading } = useSelector(selectUser);

  const handleSubmit = (event: SyntheticEvent): void => {
    event.preventDefault();
    if (!loading) void dispatch(login({ email, password }));
  };

  if (loading) return <Preloader />;

  return (
    <LoginUI
      errorText={error ?? undefined}
      email={email}
      password={password}
      setEmail={setEmail}
      setPassword={setPassword}
      handleSubmit={handleSubmit}
    />
  );
};
