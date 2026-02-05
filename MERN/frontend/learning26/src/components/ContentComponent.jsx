
export const ContentComponent = () => {
    
    var year = 2026;
    var title = "Portfolio";
    var isAlive = true;

    var myDetails = {
        fname: "Vinayak Damodar Savarkar",
        name: "Veer Savarkar",
        born: "28 May 1883, Bhagur (near Nashik), Maharashtra",
        died: "26 February 1966, Mumbai",
        isAlive: false,
        nationality: "Indian",
        profession: "Freedom Fighter, Revolutionary, Writer, Poet, Politician, Social Reformer",
        knownfor: "Indian independence movement, Hindutva ideology, writings and activism",
    };

    return (
    <div style={{
        backgroundColor: "beige",
        border: "1px solid brown",
        color: "brown",
        minHeight: "500px",
        height: "auto",
        padding: "10px"
    }}>
        <h1 style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
        }}><span>{title} : {year}</span><span><img src="/images.jpg" alt="Profile Photo" /></span></h1>
        <h2>Full Name : {myDetails.fname}</h2>
        <h2>Name Known By : {myDetails.name}</h2>
        <h2>Born : {myDetails.born}</h2>
        <h2>Died : {myDetails.died}</h2>
        <h2>Nationality : {myDetails.nationality}</h2>
        <h2>Profession : {myDetails.profession}</h2>
        <h2>Known For : {myDetails.knownfor}</h2>
        <h2>Status : {isAlive == true ? "Alive" : "Dead"}</h2>
    </div>
    )
}