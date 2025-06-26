import { useEffect, useContext } from 'react';
import { userContext } from '../../contexts/userContext';
import { logoutApi } from '../../controllers/API/user';

const OAuth2LogoutCallback = () => {
    const { setUser } = useContext(userContext);
    useEffect(() => {
        logoutApi().finally(() => {
            setUser(null);
            localStorage.clear();
        });
    }, [setUser]);
    return null;
};

export default OAuth2LogoutCallback; 