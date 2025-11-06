import './Signup.css';
import { Link } from "react-router-dom";
/*
 * МІНІМАЛЬНИЙ ШАБЛОN (Login.jsx)
 *
 * Пояснення:
 * 1. Створюй розмітку (HTML/JSX) тут.
 * 2. Давай елементам семантичні 'className' (напр., "login-title").
 * 3. Переходь в 'Login.css', щоб стилізувати ці класи.
 */
const Login = () => {
  return (
    // Можеш додати 'login-page-wrapper' для центрування
    <div>
      
      <h1 className="login-title">Sign Up</h1>
      <div className='input_div0'>
        <h2 className='subtitle_1'>
            Name
          </h2>
          <input className='email_input'></input>
      </div>
      <div className='input_div'>
          <h2 className='subtitle_1'>
              Email
          </h2>
          <input className='email_input' placeholder="name@example.com"></input>
        </div>
      <div className='input_div2'>
        <h2 className='subtitle_2'>
              Password
          </h2>
          <input type="password"  className='email_input'></input>
      </div>
      <div className='button_conteiner'>
      <button className='button_log'>Sign Up</button>
      </div >
      <p className='registr_acc'>Do you have an account?
        <Link to="/" className='credits'>Log In </Link>
      </p>
    </div>
  );
};

export default Login;