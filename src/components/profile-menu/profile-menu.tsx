import { ProfileMenuUI } from '@ui';
import { useLocation, useNavigate } from 'react-router-dom';

import { selectUser } from '@services/selectors';
import { logout } from '@services/slices';
import { useDispatch, useSelector } from '@services/store';

export const ProfileMenu = (): React.JSX.Element => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { logoutError: error, loading } = useSelector(selectUser);

  const handleLogout = (): void => {
    if (loading) return;

    void dispatch(logout())
      .unwrap()
      .then(() => navigate('/login', { replace: true }))
      .catch(() => undefined);
  };

  return (
    <>
      <ProfileMenuUI handleLogout={handleLogout} pathname={pathname} />
      {error && <p role="alert">{error}</p>}
    </>
  );
};
