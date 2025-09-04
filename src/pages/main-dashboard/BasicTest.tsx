export default function BasicTest() {
  console.log('🔴 BasicTest component RENDERING!');

  // Force visible styles to bypass any CSS issues
  const element = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'red',
        color: 'white',
        fontSize: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
      }}
    >
      BASIC TEST VISIBLE
    </div>
  );

  console.log('🔴 BasicTest returning element:', element);
  return element;
}
