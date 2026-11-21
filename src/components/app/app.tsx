import { AppHeader, IngredientDetails, Modal, OrderInfo } from '@components';
import {
  ConstructorPage,
  Feed,
  ForgotPassword,
  Login,
  NotFound404,
  Profile,
  ProfileOrders,
  Register,
  ResetPassword,
} from '@pages';
import { Preloader } from '@ui';
import { clsx } from 'clsx';
import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import { selectIngredients, selectUser } from '@services/selectors';
import { checkAuth, loadIngredients } from '@services/slices';
import { useDispatch, useSelector } from '@services/store';

import type { ReactNode } from 'react';
import type { Location } from 'react-router-dom';

import '../../index.css';

import styles from './app.module.css';

type RouteState = {
  background?: Location;
  from?: Location;
};

const ProtectedRoute = ({
  children,
  onlyGuest = false,
}: {
  children: ReactNode;
  onlyGuest?: boolean;
}): React.JSX.Element => {
  const { user, checked } = useSelector(selectUser);
  const location = useLocation();
  const state = location.state as RouteState | null;

  if (!checked) return <Preloader />;

  if (onlyGuest && user) return <Navigate to={state?.from ?? '/'} replace />;

  if (!onlyGuest && !user)
    return <Navigate to="/login" state={{ from: location }} replace />;

  return <>{children}</>;
};

const IngredientsGate = ({ children }: { children: ReactNode }): React.JSX.Element => {
  const { loading, loaded, error } = useSelector(selectIngredients);
  const dispatch = useDispatch();

  if (error)
    return (
      <div className={styles.message}>
        <p>{error}</p>
        <button
          onClick={() => {
            void dispatch(loadIngredients());
          }}
        >
          Повторить загрузку
        </button>
      </div>
    );

  if (loading || !loaded) return <Preloader />;

  return <>{children}</>;
};

const App = (): React.JSX.Element => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const background = (location.state as RouteState | null)?.background;

  useEffect(() => {
    void dispatch(loadIngredients());
    void dispatch(checkAuth());
  }, [dispatch]);

  const closeModal = (): void => {
    void navigate(-1);
  };

  const ingredientPage = (
    <IngredientsGate>
      <div className={styles.detailPageWrap}>
        <h1 className={clsx(styles.detailHeader, 'text text_type_main-large')}>
          Детали ингредиента
        </h1>
        <IngredientDetails />
      </div>
    </IngredientsGate>
  );

  const orderPage = (
    <IngredientsGate>
      <div className={styles.detailPageWrap}>
        <OrderInfo />
      </div>
    </IngredientsGate>
  );

  return (
    <div className={styles.app}>
      <AppHeader />
      <Routes location={background ?? location}>
        <Route
          path="/"
          element={
            <IngredientsGate>
              <ConstructorPage />
            </IngredientsGate>
          }
        />
        <Route
          path="/feed"
          element={
            <IngredientsGate>
              <Feed />
            </IngredientsGate>
          }
        />
        <Route path="/ingredients/:id" element={ingredientPage} />
        <Route path="/feed/:number" element={orderPage} />
        <Route
          path="/login"
          element={
            <ProtectedRoute onlyGuest>
              <Login />
            </ProtectedRoute>
          }
        />
        <Route
          path="/register"
          element={
            <ProtectedRoute onlyGuest>
              <Register />
            </ProtectedRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <ProtectedRoute onlyGuest>
              <ForgotPassword />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <ProtectedRoute onlyGuest>
              <ResetPassword />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/orders"
          element={
            <ProtectedRoute>
              <IngredientsGate>
                <ProfileOrders />
              </IngredientsGate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/orders/:number"
          element={<ProtectedRoute>{orderPage}</ProtectedRoute>}
        />
        <Route path="*" element={<NotFound404 />} />
      </Routes>

      {background && (
        <Routes>
          <Route
            path="/ingredients/:id"
            element={
              <Modal title="Детали ингредиента" onClose={closeModal}>
                <IngredientsGate>
                  <IngredientDetails />
                </IngredientsGate>
              </Modal>
            }
          />
          <Route
            path="/feed/:number"
            element={
              <Modal title="Информация о заказе" onClose={closeModal}>
                <IngredientsGate>
                  <OrderInfo />
                </IngredientsGate>
              </Modal>
            }
          />
          <Route
            path="/profile/orders/:number"
            element={
              <ProtectedRoute>
                <Modal title="Информация о заказе" onClose={closeModal}>
                  <IngredientsGate>
                    <OrderInfo />
                  </IngredientsGate>
                </Modal>
              </ProtectedRoute>
            }
          />
        </Routes>
      )}
    </div>
  );
};

export default App;
