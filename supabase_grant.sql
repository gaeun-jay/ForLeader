-- anon (비로그인 클라이언트)과 authenticated 역할에 테이블 접근 권한 부여
GRANT SELECT, INSERT, UPDATE ON TABLE meetings TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE responses TO anon, authenticated;
