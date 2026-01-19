
export default  function section({title, undersection}){
    return(
        <section style={{marginBottom: "2rem"}}>
            <h2>{title}</h2>
            <h3>{undersection}</h3>
        </section>
    )
}