import { Preloader } from '@ui';
import { ForgotPasswordUI } from '@ui-pages';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { selectUser } from '@services/selectors';
import { recoverPassword } from '@services/slices';
import { useDispatch, useSelector } from '@services/store';

import type { SyntheticEvent } from 'react';

export const ForgotPassword = (): React.JSX.Element => {
  const [email, setEmail] = useState('');
  const { loading, error } = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = (event: SyntheticEvent): void => {
    event.preventDefault();

    if (!loading)
      void dispatch(recoverPassword(email))
        .unwrap()
        .then(() => navigate('/reset-password', { replace: true }))
        .catch(() => undefined);
  };

  if (loading) return <Preloader />;

  return (
    <ForgotPasswordUI
      errorText={error ?? undefined}
      email={email}
      setEmail={setEmail}
      handleSubmit={handleSubmit}
    />
  );
};
