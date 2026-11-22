import { ProfileUI } from '@ui-pages';
import { useEffect, useState } from 'react';

import { selectUser } from '@services/selectors';
import { updateUser } from '@services/slices';
import { useDispatch, useSelector } from '@services/store';

import type { ChangeEvent, SyntheticEvent } from 'react';

export const Profile = (): React.JSX.Element => {
  const { user, loading, updateError: error } = useSelector(selectUser);
  const dispatch = useDispatch();

  const [formValue, setFormValue] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    password: '',
  });

  useEffect(() => {
    setFormValue({
      name: user?.name ?? '',
      email: user?.email ?? '',
      password: '',
    });
  }, [user]);

  const isFormChanged =
    formValue.name !== user?.name ||
    formValue.email !== user?.email ||
    !!formValue.password;

  const handleSubmit = (event: SyntheticEvent): void => {
    event.preventDefault();

    if (loading || !isFormChanged) return;

    const data = {
      name: formValue.name,
      email: formValue.email,
      ...(formValue.password ? { password: formValue.password } : {}),
    };

    void dispatch(updateUser(data));
  };

  const handleCancel = (event: SyntheticEvent): void => {
    event.preventDefault();

    setFormValue({
      name: user?.name ?? '',
      email: user?.email ?? '',
      password: '',
    });
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setFormValue((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  return (
    <>
      {loading && <p>Сохранение...</p>}
      <ProfileUI
        formValue={formValue}
        isFormChanged={isFormChanged}
        handleSubmit={handleSubmit}
        handleCancel={handleCancel}
        handleInputChange={handleInputChange}
        updateUserError={error ?? undefined}
      />
    </>
  );
};
