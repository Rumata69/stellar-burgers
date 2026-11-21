import { Preloader } from '@ui';
import { RegisterUI } from '@ui-pages';
import { useState } from 'react';

import { selectUser } from '@services/selectors';
import { register } from '@services/slices';
import { useDispatch, useSelector } from '@services/store';

import type { SyntheticEvent } from 'react';

export const Register = (): React.JSX.Element => {
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const { loading, error } = useSelector(selectUser);

  const handleSubmit = (event: SyntheticEvent): void => {
    event.preventDefault();

    if (!loading) void dispatch(register({ name: userName, email, password }));
  };

  if (loading) return <Preloader />;

  return (
    <RegisterUI
      errorText={error ?? undefined}
      userName={userName}
      email={email}
      password={password}
      setUserName={setUserName}
      setEmail={setEmail}
      setPassword={setPassword}
      handleSubmit={handleSubmit}
    />
  );
};
