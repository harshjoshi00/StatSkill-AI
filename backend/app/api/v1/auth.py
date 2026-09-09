from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User, Profile, UserRole
from app.schemas.auth import UserRegister, UserLogin, Token, UserOut
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new Statistical Official.
    Registers user with role=EMPLOYEE and initializes their empty profile record.
    """
    # Check duplicate email
    existing_user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )

    # Hash password & create user
    hashed_pwd = get_password_hash(user_in.password)
    user = User(
        email=user_in.email.lower(),
        password_hash=hashed_pwd,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        role=UserRole.EMPLOYEE,
        is_active=True
    )
    db.add(user)
    db.flush()

    # Create associated empty profile
    profile = Profile(user_id=user.id)
    db.add(profile)
    db.commit()
    db.refresh(user)

    # Generate JWT token
    access_token = create_access_token(subject=user.id, role=user.role.value)
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user and return JWT bearer access token.
    """
    user = db.query(User).filter(User.email == login_in.email.lower()).first()
    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )

    access_token = create_access_token(subject=user.id, role=user.role.value)

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Get profile information of the currently authenticated user.
    """
    return UserOut.model_validate(current_user)
